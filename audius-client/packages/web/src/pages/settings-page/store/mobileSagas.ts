import { select, call, put, takeEvery } from 'redux-saga/effects'

import { getAccountUser } from 'common/store/account/selectors'
import AudiusBackend from 'services/AudiusBackend'
import {
  EnablePushNotificationsMessage,
  DisablePushNotificationsMessage
} from 'services/native-mobile-interface/notifications'
import { waitForBackendSetup } from 'store/backend/sagas'
import { waitForValue } from 'utils/sagaHelpers'

import * as actions from './actions'
import { initialState } from './reducer'
import { getPushNotificationSettings } from './selectors'
import { PushNotificationSetting } from './types'

function* watchGetPushNotificationSettings() {
  yield takeEvery(actions.GET_PUSH_NOTIFICATION_SETTINGS, function* () {
    yield call(waitForBackendSetup)
    try {
      const settings = yield call(AudiusBackend.getPushNotificationSettings)
      const pushNotificationSettings = {
        ...settings,
        [PushNotificationSetting.MobilePush]: !!settings
      }
      yield put(actions.setPushNotificationSettings(pushNotificationSettings))
    } catch (e) {
      console.error(e)
      yield put(actions.getPushNotificationSettingsFailed(e.message))
    }
  })
}

export async function disablePushNotifications() {
  // Disabling push notifications should delete the device token
  const message = new DisablePushNotificationsMessage()
  message.send()
  const { token } = await message.receive()
  if (token) {
    await AudiusBackend.deregisterDeviceToken(token)
  }
}

function* watchUpdatePushNotificationSettings() {
  yield takeEvery(actions.TOGGLE_PUSH_NOTIFICATION_SETTING, function* (
    action: actions.TogglePushNotificationSetting
  ) {
    let isOn = action.isOn

    try {
      if (action.notificationType === PushNotificationSetting.MobilePush) {
        if (isOn) {
          // Enabling push notifications should enable all of the notification types
          const message = new EnablePushNotificationsMessage()
          message.send()
          const { token, os } = yield call(async () => message.receive())

          const newSettings = { ...initialState.pushNotifications }
          yield put(actions.setPushNotificationSettings(newSettings))

          // We need a user for this to work (and in the case of sign up, we might not
          // have one right away when this function is called)
          // @ts-ignore: remove this ignore when waitForValue is typed
          yield call(waitForValue, getAccountUser)
          yield call(AudiusBackend.updatePushNotificationSettings, newSettings)
          yield call(AudiusBackend.registerDeviceToken, token, os)
        } else {
          yield call(disablePushNotifications)
        }
      } else {
        if (isOn === undefined) {
          const pushNotificationSettings = yield select(
            getPushNotificationSettings
          )
          isOn = !pushNotificationSettings[action.notificationType]
        }
        yield call(AudiusBackend.updatePushNotificationSettings, {
          [action.notificationType]: isOn
        })
      }
    } catch (e) {
      yield put(
        actions.togglePushNotificationSettingFailed(
          action.notificationType,
          action.isOn
        )
      )
    }
  })
}

export default function sagas() {
  return [watchGetPushNotificationSettings, watchUpdatePushNotificationSettings]
}
