import { Name } from '@audius/common/models'
import {
  settingsPageSelectors,
  settingsPageActions as actions,
  BrowserNotificationSetting,
  getContext
} from '@audius/common/store'
import { getErrorMessage } from '@audius/common/utils'
import { select, call, put, takeEvery } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import commonSettingsSagas from 'common/store/pages/settings/sagas'
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

const { getBrowserNotificationSettings } = settingsPageSelectors

function* watchGetSettings() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(actions.GET_NOTIFICATION_SETTINGS, function* () {
    try {
      if (!isBrowserPushAvailable) return
      const settings = yield* call(
        audiusBackendInstance.getBrowserPushNotificationSettings
      )
      // If settings exist, set them in the store, else leave it at the defaults.
      if (settings) yield* put(actions.setNotificationSettings(settings))
      if (!isElectron()) {
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
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
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
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(
    actions.SET_BROWSER_NOTIFICATION_SETTINGS_ON,
    function* (action: actions.SetBrowserNotificationSettingsOn) {
      try {
        const updatedSettings = {
          [BrowserNotificationSetting.MilestonesAndAchievements]: true,
          [BrowserNotificationSetting.Followers]: true,
          [BrowserNotificationSetting.Reposts]: true,
          [BrowserNotificationSetting.Favorites]: true,
          [BrowserNotificationSetting.Remixes]: true,
          [BrowserNotificationSetting.Messages]: true,
          [BrowserNotificationSetting.Comments]: true,
          [BrowserNotificationSetting.Mentions]: true
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

function* watchSetBrowserNotificationSettingsOff() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(
    actions.SET_BROWSER_NOTIFICATION_SETTINGS_OFF,
    function* (action: actions.SetBrowserNotificationSettingsOff) {
      try {
        const updatedSettings = {
          [BrowserNotificationSetting.MilestonesAndAchievements]: false,
          [BrowserNotificationSetting.Followers]: false,
          [BrowserNotificationSetting.Reposts]: false,
          [BrowserNotificationSetting.Favorites]: false,
          [BrowserNotificationSetting.Remixes]: false,
          [BrowserNotificationSetting.Messages]: false,
          [BrowserNotificationSetting.Comments]: false,
          [BrowserNotificationSetting.Mentions]: false
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
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
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

export default function sagas() {
  return [
    ...commonSettingsSagas(),
    watchGetSettings,
    watchSetBrowserNotificationSettingsOn,
    watchSetBrowserNotificationSettingsOff,
    watchToogleBrowserPushNotification,
    watchUpdateNotificationSettings
  ]
}
