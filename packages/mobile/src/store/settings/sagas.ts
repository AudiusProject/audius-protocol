import { queryAccountUser, queryHasAccount } from '@audius/common/api'
import type { PushNotifications as TPushNotifications } from '@audius/common/store'
import {
  settingsPageSelectors,
  settingsPageInitialState as initialState,
  settingsPageActions,
  PushNotificationSetting,
  getContext,
  getSDK
} from '@audius/common/store'
import { getErrorMessage, waitForAccount } from '@audius/common/utils'
import { waitForRead } from '@audius/web/src/utils/sagaHelpers'
import commonSettingsSagas from 'common/store/pages/settings/sagas'
import { mapValues } from 'lodash'
import { RESULTS, checkNotifications } from 'react-native-permissions'
import { select, call, put, takeEvery, take } from 'typed-redux-saga'

import PushNotifications from 'app/notifications'

import { setVisibility } from '../drawers/slice'

const { getPushNotificationSettings, SET_PUSH_NOTIFICATION_SETTINGS } =
  settingsPageActions
const { getPushNotificationSettings: selectPushNotificationSettings } =
  settingsPageSelectors

function* getIsMobilePushEnabled() {
  yield* put(getPushNotificationSettings())
  yield* take(SET_PUSH_NOTIFICATION_SETTINGS)
  const { [PushNotificationSetting.MobilePush]: isMobilePushEnabled } =
    yield* select(selectPushNotificationSettings)
  return isMobilePushEnabled
}

export function* deregisterPushNotifications() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()
  const { token } = yield* call([PushNotifications, 'getToken'])
  PushNotifications.deregister()
  yield* call(audiusBackendInstance.deregisterDeviceToken, {
    sdk,
    deviceToken: token
  })
}

function* registerDeviceToken() {
  yield* call([PushNotifications, 'requestPermission'])
  const { token, os } = yield* call([PushNotifications, 'getToken'])

  const audiusBackend = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()
  yield* call(audiusBackend.registerDeviceToken, {
    sdk,
    deviceToken: token,
    deviceType: os
  })
}

function* reregisterDeviceTokenOnStartup() {
  yield* call(waitForAccount)
  const isSignedIn = yield* call(queryHasAccount)
  if (!isSignedIn) return

  const { status } = yield* call(checkNotifications)
  const isMobilePushEnabled = yield* call(getIsMobilePushEnabled)

  if (
    (status === RESULTS.GRANTED || status === RESULTS.LIMITED) &&
    isMobilePushEnabled
  ) {
    yield* call(registerDeviceToken)
  }
}

function* enablePushNotifications() {
  yield* call(registerDeviceToken)

  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()

  // Enabling push notifications should enable all of the notification types
  const newSettings = { ...initialState.pushNotifications }
  yield* put(settingsPageActions.setPushNotificationSettings(newSettings))

  // We need a user for this to work (and in the case of sign up, we might not
  // have one right away when this function is called)
  yield* call(queryAccountUser)
  yield* call(audiusBackendInstance.updatePushNotificationSettings, {
    sdk,
    settings: newSettings
  })
}

function* disablePushNotifications() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()
  const newSettings = mapValues(
    initialState.pushNotifications,
    function (_val: boolean) {
      return false
    }
  )
  yield* put(settingsPageActions.setPushNotificationSettings(newSettings))
  yield* call(queryAccountUser)
  yield* call(audiusBackendInstance.updatePushNotificationSettings, {
    sdk,
    settings: newSettings
  })
  yield* call(deregisterPushNotifications)
}

function pushNotificationsEnabled(settings: TPushNotifications): boolean {
  for (const key in initialState.pushNotifications) {
    if (key === PushNotificationSetting.MobilePush) continue
    if (settings[key]) return true
  }
  return false
}

function* watchGetPushNotificationSettings() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()
  yield* takeEvery(
    settingsPageActions.GET_PUSH_NOTIFICATION_SETTINGS,
    function* () {
      yield* call(waitForRead)
      const hasAccount = yield* call(queryHasAccount)
      if (!hasAccount) return

      try {
        const settings = yield* call(
          audiusBackendInstance.getPushNotificationSettings,
          { sdk }
        )
        let pushNotificationSettings = mapValues(
          initialState.pushNotifications,
          function (_val: boolean) {
            return false
          }
        )

        if (settings) {
          pushNotificationSettings = {
            ...settings,
            [PushNotificationSetting.MobilePush]: yield* call(
              pushNotificationsEnabled,
              settings
            )
          }
        }
        yield* put(
          settingsPageActions.setPushNotificationSettings(
            pushNotificationSettings
          )
        )
      } catch (error) {
        const errorMessage = getErrorMessage(error)
        console.error(errorMessage)
        yield* put(
          settingsPageActions.getPushNotificationSettingsFailed(errorMessage)
        )
      }
    }
  )
}

function* watchUpdatePushNotificationSettings() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()
  yield* takeEvery(
    settingsPageActions.TOGGLE_PUSH_NOTIFICATION_SETTING,
    function* (action: settingsPageActions.TogglePushNotificationSetting) {
      let isOn = action.isOn

      try {
        if (action.notificationType === PushNotificationSetting.MobilePush) {
          if (isOn) {
            yield* call(enablePushNotifications)
          } else {
            yield* call(disablePushNotifications)
          }
        } else {
          if (isOn === undefined) {
            const pushNotificationSettings = yield* select(
              selectPushNotificationSettings
            )
            isOn = !pushNotificationSettings[action.notificationType]
          }
          yield* call(audiusBackendInstance.updatePushNotificationSettings, {
            sdk,
            settings: { [action.notificationType]: isOn }
          })
        }
      } catch (e) {
        yield* put(
          settingsPageActions.togglePushNotificationSettingFailed(
            action.notificationType,
            action.isOn
          )
        )
      }
    }
  )
}

function* watchRequestPushNotificationPermissions() {
  yield* takeEvery(
    settingsPageActions.REQUEST_PUSH_NOTIFICATION_PERMISSIONS,
    function* () {
      const { status } = yield* call(checkNotifications)
      const isMobilePushEnabled = yield* call(getIsMobilePushEnabled)

      if (
        (status === RESULTS.GRANTED || status === RESULTS.LIMITED) &&
        isMobilePushEnabled
      ) {
        yield* call(registerDeviceToken)
      } else if (status === RESULTS.BLOCKED || status === RESULTS.UNAVAILABLE) {
        // do nothing
      } else {
        yield* put(
          setVisibility({ drawer: 'EnablePushNotifications', visible: true })
        )
      }
    }
  )
}

export default function sagas() {
  return [
    ...commonSettingsSagas(),
    reregisterDeviceTokenOnStartup,
    watchGetPushNotificationSettings,
    watchUpdatePushNotificationSettings,
    watchRequestPushNotificationPermissions
  ]
}
