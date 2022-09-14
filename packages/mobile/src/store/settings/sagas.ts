import type { PushNotifications as TPushNotifications } from '@audius/common'
import {
  getErrorMessage,
  accountSelectors,
  settingsPageInitialState as initialState,
  settingsPageSelectors,
  PushNotificationSetting,
  settingsPageActions as actions,
  getContext,
  waitForValue
} from '@audius/common'
import { waitForBackendSetup } from 'common/store/backend/sagas'
import commonSettingsSagas from 'common/store/pages/settings/sagas'
import { select, call, put, takeEvery } from 'typed-redux-saga'

import PushNotifications from 'app/notifications'

const { getPushNotificationSettings } = settingsPageSelectors
const { getAccountUser } = accountSelectors

export function* disablePushNotifications() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { token } = yield* call([PushNotifications, 'getToken'])
  PushNotifications.deregister()
  yield* call(audiusBackendInstance.deregisterDeviceToken, token)
}

function* watchGetPushNotificationSettings() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(actions.GET_PUSH_NOTIFICATION_SETTINGS, function* () {
    yield* call(waitForBackendSetup)
    try {
      const settings = (yield* call(
        audiusBackendInstance.getPushNotificationSettings
      )) as TPushNotifications
      const pushNotificationSettings = {
        ...settings,
        [PushNotificationSetting.MobilePush]: !!settings
      }
      yield* put(actions.setPushNotificationSettings(pushNotificationSettings))
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      console.error(errorMessage)
      yield* put(actions.getPushNotificationSettingsFailed(errorMessage))
    }
  })
}

function* watchUpdatePushNotificationSettings() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(
    actions.TOGGLE_PUSH_NOTIFICATION_SETTING,
    function* (action: actions.TogglePushNotificationSetting) {
      let isOn = action.isOn

      try {
        if (action.notificationType === PushNotificationSetting.MobilePush) {
          if (isOn) {
            yield* call([PushNotifications, 'requestPermission'])
            const { token, os } = yield* call([PushNotifications, 'getToken'])
            // Enabling push notifications should enable all of the notification types
            const newSettings = { ...initialState.pushNotifications }
            yield* put(actions.setPushNotificationSettings(newSettings))

            // We need a user for this to work (and in the case of sign up, we might not
            // have one right away when this function is called)
            yield* call(waitForValue, getAccountUser)
            yield* call(
              audiusBackendInstance.updatePushNotificationSettings,
              newSettings
            )
            yield* call(audiusBackendInstance.registerDeviceToken, token, os)
          } else {
            yield* call(disablePushNotifications)
          }
        } else {
          if (isOn === undefined) {
            const pushNotificationSettings = yield* select(
              getPushNotificationSettings
            )
            isOn = !pushNotificationSettings[action.notificationType]
          }
          yield* call(audiusBackendInstance.updatePushNotificationSettings, {
            [action.notificationType]: isOn
          })
        }
      } catch (e) {
        yield* put(
          actions.togglePushNotificationSettingFailed(
            action.notificationType,
            action.isOn
          )
        )
      }
    }
  )
}

export default function sagas() {
  return [
    ...commonSettingsSagas(),
    watchGetPushNotificationSettings,
    watchUpdatePushNotificationSettings
  ]
}
