import { select, call, put, takeEvery } from 'redux-saga/effects'

import { Name } from 'common/models/Analytics'
import AudiusBackend from 'services/AudiusBackend'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
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

import * as actions from './actions'
import errorSagas from './errorSagas'
import mobileSagas from './mobileSagas'
import { CAST_METHOD } from './reducer'
import { getBrowserNotificationSettings } from './selectors'
import { BrowserNotificationSetting } from './types'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

function* watchGetSettings() {
  yield takeEvery(actions.GET_NOTIFICATION_SETTINGS, function* () {
    try {
      yield call(waitForBackendSetup)
      const emailSettings = yield call(
        AudiusBackend.getEmailNotificationSettings
      )
      yield put(
        actions.updateEmailFrequency(
          emailSettings.settings.emailFrequency,
          false
        )
      )
      if (!isBrowserPushAvailable) return
      const settings = yield call(
        AudiusBackend.getBrowserPushNotificationSettings
      )
      // If settings exist, set them in the store, else leave it at the defaults.
      if (settings) yield put(actions.setNotificationSettings(settings))
      if (!isElectron() && !NATIVE_MOBILE) {
        if (isPushManagerAvailable) {
          const permission = yield call(getPushManagerPermission)
          yield put(actions.setBrowserNotificationPermission(permission))
          if (permission === Permission.GRANTED) {
            const subscription = yield call(getPushManagerBrowserSubscription)
            const enabled = yield call(
              AudiusBackend.getBrowserPushSubscription,
              subscription.endpoint
            )
            yield put(actions.setBrowserNotificationEnabled(enabled, false))
          }
        } else if (isSafariPushAvailable) {
          const permissionData = yield call(getSafariPushBrowser)
          yield put(
            actions.setBrowserNotificationPermission(permissionData.permission)
          )
          if (permissionData.permission === Permission.GRANTED) {
            const enabled = yield call(
              AudiusBackend.getSafariBrowserPushEnabled,
              permissionData.deviceToken
            )
            yield put(actions.setBrowserNotificationEnabled(enabled, false))
          }
        }
      }
    } catch (err) {
      yield put(actions.getNotificationSettingsFailed(err.message))
    }
  })
}

function* watchToogleBrowserPushNotification() {
  yield takeEvery(actions.SET_BROWSER_NOTIFICATION_ENABLED, function* (
    action: actions.SetBrowserNotificationEnabled
  ) {
    try {
      if (isPushManagerAvailable) {
        const subscription = yield call(getPushManagerBrowserSubscription)
        if (subscription) {
          if (action.updateServer) {
            yield call(AudiusBackend.updateBrowserNotifications, {
              enabled: action.enabled,
              subscription
            })
          }
          const event = make(Name.BROWSER_NOTIFICATION_SETTINGS, {
            provider: 'gcm',
            enabled: action.enabled
          })
          yield put(event)
        }
      } else if (isSafariPushAvailable) {
        const pushPermission = getSafariPushBrowser()
        if (
          action.enabled &&
          pushPermission.permission === Permission.GRANTED
        ) {
          if (action.updateServer) {
            yield call(
              AudiusBackend.registerDeviceToken,
              pushPermission.deviceToken,
              'safari'
            )
          }

          const event = make(Name.BROWSER_NOTIFICATION_SETTINGS, {
            provider: 'safari',
            enabled: true
          })
          yield put(event)
        } else if (
          !action.enabled &&
          pushPermission.permission === Permission.GRANTED
        ) {
          if (action.updateServer) {
            yield call(
              AudiusBackend.deregisterDeviceToken,
              pushPermission.deviceToken
            )
          }

          const event = make(Name.BROWSER_NOTIFICATION_SETTINGS, {
            provider: 'safari',
            enabled: false
          })
          yield put(event)
        }
      }
    } catch (err) {
      yield put(actions.browserPushNotificationFailed(err.message))
    }
  })
}

function* watchSetBrowserNotificationSettingsOn() {
  yield takeEvery(actions.SET_BROWSER_NOTIFICATION_SETTINGS_ON, function* (
    action: actions.SetBrowserNotificationSettingsOn
  ) {
    try {
      const updatedSettings = {
        [BrowserNotificationSetting.MilestonesAndAchievements]: true,
        [BrowserNotificationSetting.Followers]: true,
        [BrowserNotificationSetting.Reposts]: true,
        [BrowserNotificationSetting.Favorites]: true,
        [BrowserNotificationSetting.Remixes]: true
      }
      yield put(actions.setNotificationSettings(updatedSettings))
      yield call(AudiusBackend.updateNotificationSettings, updatedSettings)
    } catch (err) {
      yield put(actions.browserPushNotificationFailed(err.message))
    }
  })
}

function* watchUpdateNotificationSettings() {
  yield takeEvery(actions.TOGGLE_NOTIFICATION_SETTING, function* (
    action: actions.ToggleNotificationSetting
  ) {
    try {
      let isOn = action.isOn
      if (isOn === undefined) {
        const notificationSettings = yield select(
          getBrowserNotificationSettings
        )
        isOn = notificationSettings[action.notificationType]
      }
      yield call(AudiusBackend.updateNotificationSettings, {
        [action.notificationType]: isOn
      })

      const event = make(Name.NOTIFICATIONS_TOGGLE_SETTINGS, {
        settings: action.notificationType,
        enabled: isOn
      })
      yield put(event)
    } catch (err) {
      console.error(err)
      yield put(actions.browserPushNotificationFailed(err.message))
    }
  })
}

function* watchUpdateEmailFrequency() {
  yield takeEvery(actions.UPDATE_EMAIL_FREQUENCY, function* (
    action: actions.UpdateEmailFrequency
  ) {
    if (action.updateServer) {
      yield call(
        AudiusBackend.updateEmailNotificationSettings,
        action.frequency
      )
    }
  })
}

function* watchUpdateCastMethod() {
  yield takeEvery(
    actions.UPDATE_CAST_METHOD,
    (action: actions.UpdateCastMethod) => {
      window.localStorage.setItem(CAST_METHOD, action.cast)
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
    watchUpdateCastMethod,
    errorSagas
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}
