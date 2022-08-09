import { Name } from '@audius/common'
import { select, call, put, takeEvery } from 'typed-redux-saga'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import * as actions from 'common/store/pages/settings/actions'
import { getBrowserNotificationSettings } from 'common/store/pages/settings/selectors'
import { BrowserNotificationSetting } from 'common/store/pages/settings/types'
import { getErrorMessage } from 'common/utils/error'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { make } from 'store/analytics/actions'
import {
  Permission,
  isPushManagerAvailable,
  isSafariPushAvailable,
  isBrowserPushAvailable,
  getPushManagerPermission,
  getPushManagerBrowserSubscription,
  getSafariPushBrowser
} from 'utils/browserNotifications'
import { isElectron } from 'utils/clientUtil'

import errorSagas from './errorSagas'
import mobileSagas from './mobileSagas'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* watchGetSettings() {
  yield* takeEvery(actions.GET_NOTIFICATION_SETTINGS, function* () {
    try {
      yield* call(waitForBackendSetup)
      const emailSettings = yield* call(
        audiusBackendInstance.getEmailNotificationSettings
      )
      yield* put(
        actions.updateEmailFrequency(
          emailSettings.settings.emailFrequency,
          false
        )
      )
      if (!isBrowserPushAvailable) return
      const settings = yield* call(
        audiusBackendInstance.getBrowserPushNotificationSettings
      )
      // If settings exist, set them in the store, else leave it at the defaults.
      if (settings) yield* put(actions.setNotificationSettings(settings))
      if (!isElectron() && !NATIVE_MOBILE) {
        if (isPushManagerAvailable) {
          const permission = yield* call(getPushManagerPermission)
          if (permission) {
            yield* put(actions.setBrowserNotificationPermission(permission))
            if (permission === Permission.GRANTED) {
              const subscription = yield* call(
                getPushManagerBrowserSubscription
              )
              const enabled = yield* call(
                audiusBackendInstance.getBrowserPushSubscription,
                subscription.endpoint
              )
              yield* put(actions.setBrowserNotificationEnabled(enabled, false))
            }
          }
        } else if (isSafariPushAvailable) {
          const permissionData = yield* call(getSafariPushBrowser)
          yield* put(
            actions.setBrowserNotificationPermission(permissionData.permission)
          )
          if (permissionData.permission === Permission.GRANTED) {
            const enabled = yield* call(
              audiusBackendInstance.getSafariBrowserPushEnabled,
              permissionData.deviceToken
            )
            yield* put(actions.setBrowserNotificationEnabled(enabled, false))
          }
        }
      }
    } catch (error) {
      yield* put(actions.getNotificationSettingsFailed(getErrorMessage(error)))
    }
  })
}

function* watchToogleBrowserPushNotification() {
  yield* takeEvery(
    actions.SET_BROWSER_NOTIFICATION_ENABLED,
    function* (action: actions.SetBrowserNotificationEnabled) {
      try {
        if (isPushManagerAvailable) {
          const subscription = yield* call(getPushManagerBrowserSubscription)
          if (subscription) {
            if (action.updateServer) {
              yield* call(audiusBackendInstance.updateBrowserNotifications, {
                enabled: action.enabled,
                subscription
              })
            }
            const event = make(Name.BROWSER_NOTIFICATION_SETTINGS, {
              provider: 'gcm',
              enabled: action.enabled
            })
            yield* put(event)
          }
        } else if (isSafariPushAvailable) {
          const pushPermission = getSafariPushBrowser()
          if (
            action.enabled &&
            pushPermission.permission === Permission.GRANTED
          ) {
            if (action.updateServer) {
              yield* call(
                audiusBackendInstance.registerDeviceToken,
                pushPermission.deviceToken,
                'safari'
              )
            }

            const event = make(Name.BROWSER_NOTIFICATION_SETTINGS, {
              provider: 'safari',
              enabled: true
            })
            yield* put(event)
          } else if (
            !action.enabled &&
            pushPermission.permission === Permission.GRANTED
          ) {
            if (action.updateServer) {
              yield* call(
                audiusBackendInstance.deregisterDeviceToken,
                pushPermission.deviceToken
              )
            }

            const event = make(Name.BROWSER_NOTIFICATION_SETTINGS, {
              provider: 'safari',
              enabled: false
            })
            yield* put(event)
          }
        }
      } catch (error) {
        yield* put(
          actions.browserPushNotificationFailed(getErrorMessage(error))
        )
      }
    }
  )
}

function* watchSetBrowserNotificationSettingsOn() {
  yield* takeEvery(
    actions.SET_BROWSER_NOTIFICATION_SETTINGS_ON,
    function* (action: actions.SetBrowserNotificationSettingsOn) {
      try {
        const updatedSettings = {
          [BrowserNotificationSetting.MilestonesAndAchievements]: true,
          [BrowserNotificationSetting.Followers]: true,
          [BrowserNotificationSetting.Reposts]: true,
          [BrowserNotificationSetting.Favorites]: true,
          [BrowserNotificationSetting.Remixes]: true
        }
        yield* put(actions.setNotificationSettings(updatedSettings))
        yield* call(
          audiusBackendInstance.updateNotificationSettings,
          updatedSettings
        )
      } catch (error) {
        yield* put(
          actions.browserPushNotificationFailed(getErrorMessage(error))
        )
      }
    }
  )
}

function* watchUpdateNotificationSettings() {
  yield* takeEvery(
    actions.TOGGLE_NOTIFICATION_SETTING,
    function* (action: actions.ToggleNotificationSetting) {
      try {
        let isOn: boolean | null | undefined | Permission = action.isOn
        if (isOn === undefined) {
          const notificationSettings = yield* select(
            getBrowserNotificationSettings
          )
          isOn = notificationSettings[action.notificationType]
        }
        yield* call(audiusBackendInstance.updateNotificationSettings, {
          [action.notificationType]: isOn
        })

        const event = make(Name.NOTIFICATIONS_TOGGLE_SETTINGS, {
          settings: action.notificationType,
          enabled: isOn
        })
        yield* put(event)
      } catch (error) {
        console.error(error)
        yield* put(
          actions.browserPushNotificationFailed(getErrorMessage(error))
        )
      }
    }
  )
}

function* watchUpdateEmailFrequency() {
  yield* takeEvery(
    actions.UPDATE_EMAIL_FREQUENCY,
    function* (action: actions.UpdateEmailFrequency) {
      if (action.updateServer) {
        yield* call(
          audiusBackendInstance.updateEmailNotificationSettings,
          action.frequency
        )
      }
    }
  )
}

export default function sagas() {
  const sagas = [
    watchGetSettings,
    watchSetBrowserNotificationSettingsOn,
    watchToogleBrowserPushNotification,
    watchUpdateNotificationSettings,
    watchUpdateEmailFrequency,
    errorSagas
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}
