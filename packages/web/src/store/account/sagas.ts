import {
  accountActions,
  accountSelectors,
  accountSagas as commonAccountSagas,
  settingsPageActions,
  modalsActions
} from '@audius/common/store'
import { call, getContext, put, select, takeEvery } from 'typed-redux-saga'

import webCommonAccountSagas from 'common/store/account/sagas'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import {
  Permission,
  isPushManagerAvailable,
  isSafariPushAvailable,
  getPushManagerPermission,
  getPushManagerBrowserSubscription,
  getSafariPushBrowser,
  subscribePushManagerBrowser,
  setHasRequestedBrowserPermission,
  shouldRequestBrowserPermission,
  removeHasRequestedBrowserPermission
} from 'utils/browserNotifications'
import { isElectron } from 'utils/clientUtil'

const { setVisibility } = modalsActions
const {
  setBrowserNotificationPermission,
  setBrowserNotificationEnabled,
  setBrowserNotificationSettingsOn
} = settingsPageActions

const { getAccountUser } = accountSelectors

const setBrowerPushPermissionConfirmationModal = setVisibility({
  modal: 'BrowserPushPermissionConfirmation',
  visible: true
})

/**
 * Determine if the push notification modal should appear
 */
export function* showPushNotificationConfirmation() {
  const isMobile = yield* getContext('isMobile')
  if (isMobile || isElectron() || !shouldRequestBrowserPermission()) return
  setHasRequestedBrowserPermission()
  const account = yield* select(getAccountUser)
  if (!account) return
  const browserPermission = yield* call(fetchBrowserPushNotificationStatus)
  if (browserPermission === Permission.DEFAULT) {
    yield* put(setBrowerPushPermissionConfirmationModal)
  } else if (browserPermission === Permission.GRANTED) {
    if (isPushManagerAvailable) {
      const subscription = yield* call(getPushManagerBrowserSubscription)
      const enabled = yield* call(
        audiusBackendInstance.getBrowserPushSubscription,
        subscription.endpoint
      )
      if (!enabled) {
        yield* put(setBrowerPushPermissionConfirmationModal)
      }
    } else if (isSafariPushAvailable) {
      try {
        const safariPushBrowser = yield* call(getSafariPushBrowser)
        const enabled = yield* call(
          audiusBackendInstance.getBrowserPushSubscription,
          safariPushBrowser.deviceToken
        )
        if (!enabled) {
          yield* put(setBrowerPushPermissionConfirmationModal)
        }
      } catch (err) {
        console.error(err)
      }
    }
  }
}

export function* fetchBrowserPushNotificationStatus() {
  const isMobile = yield* getContext('isMobile')
  if (isElectron() || isMobile) return
  if (isPushManagerAvailable) {
    const permission = yield* call(getPushManagerPermission)
    return permission
  } else if (isSafariPushAvailable) {
    const safariSubscription = yield* call(getSafariPushBrowser)
    return safariSubscription.permission
  }
}

export function* subscribeBrowserPushNotifications() {
  if (isPushManagerAvailable) {
    const pushManagerSubscription = yield* call(
      getPushManagerBrowserSubscription
    )
    if (pushManagerSubscription) {
      yield* put(setBrowserNotificationPermission(Permission.GRANTED))
      yield* put(setBrowserNotificationEnabled(true, false))
      yield call(audiusBackendInstance.updateBrowserNotifications, {
        subscription: pushManagerSubscription,
        enabled: true
      })
      yield* put(setBrowserNotificationSettingsOn())
    } else if (
      window.Notification &&
      window.Notification.permission !== Permission.DENIED
    ) {
      const subscription = yield* call(subscribePushManagerBrowser)
      const enabled = !!subscription
      if (enabled) {
        yield* put(setBrowserNotificationPermission(Permission.GRANTED))
        yield* put(setBrowserNotificationEnabled(true, false))
        yield* call(audiusBackendInstance.updateBrowserNotifications, {
          subscription,
          enabled: true
        })
      } else {
        yield* put(setBrowserNotificationPermission(Permission.DENIED))
      }
    }
  }
  // Note: you cannot request safari permission from saga
  // it must be initiated from a user action (in the component)
  if (isSafariPushAvailable) {
    const safariSubscription = yield* call(getSafariPushBrowser)
    if (safariSubscription.permission === Permission.GRANTED) {
      yield* call(
        audiusBackendInstance.registerDeviceToken,
        safariSubscription.deviceToken,
        'safari'
      )
      yield* put(setBrowserNotificationEnabled(true, false))
      yield* put(setBrowserNotificationSettingsOn())
    }
  }
}

export function* unsubscribeBrowserPushNotifications() {
  removeHasRequestedBrowserPermission()
  const browserPushSubscriptionStatus = yield* call(
    fetchBrowserPushNotificationStatus
  )
  if (
    browserPushSubscriptionStatus === Permission.GRANTED &&
    isPushManagerAvailable
  ) {
    const subscription = yield* call(getPushManagerBrowserSubscription)
    yield* call(audiusBackendInstance.disableBrowserNotifications, {
      subscription
    })
  } else if (
    browserPushSubscriptionStatus === Permission.GRANTED &&
    isSafariPushAvailable
  ) {
    const safariSubscription = yield* call(getSafariPushBrowser)
    if (safariSubscription.permission === Permission.GRANTED) {
      yield* call(
        audiusBackendInstance.deregisterDeviceToken,
        safariSubscription.deviceToken
      )
    }
  }
}

function* getBrowserPushNotifications() {
  yield* takeEvery(
    accountActions.fetchBrowserPushNotifications.type,
    fetchBrowserPushNotificationStatus
  )
}

function* watchShowPushNotificationConfirmation() {
  yield* takeEvery(
    accountActions.showPushNotificationConfirmation.type,
    showPushNotificationConfirmation
  )
}

function* subscribeBrowserPushNotification() {
  yield* takeEvery(
    accountActions.subscribeBrowserPushNotifications.type,
    subscribeBrowserPushNotifications
  )
}

function* unsubscribeBrowserPushNotification() {
  yield* takeEvery(
    accountActions.unsubscribeBrowserPushNotifications.type,
    unsubscribeBrowserPushNotifications
  )
}

export default function sagas() {
  return [
    ...commonAccountSagas(),
    ...webCommonAccountSagas(),
    watchShowPushNotificationConfirmation,
    getBrowserPushNotifications,
    subscribeBrowserPushNotification,
    unsubscribeBrowserPushNotification
  ]
}
