import {
  getErrorMessage,
  accountSelectors,
  settingsPageInitialState as initialState,
  settingsPageSelectors,
  PushNotifications,
  PushNotificationSetting,
  settingsPageActions as actions,
  getContext,
  AudiusBackend
} from '@audius/common'
import { select, call, put, takeEvery } from 'typed-redux-saga'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import {
  EnablePushNotificationsMessage,
  DisablePushNotificationsMessage
} from 'services/native-mobile-interface/notifications'
import { waitForValue } from 'utils/sagaHelpers'
const { getPushNotificationSettings } = settingsPageSelectors
const getAccountUser = accountSelectors.getAccountUser

function* watchGetPushNotificationSettings() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(actions.GET_PUSH_NOTIFICATION_SETTINGS, function* () {
    yield* call(waitForBackendSetup)
    try {
      const settings = (yield* call(
        audiusBackendInstance.getPushNotificationSettings
      )) as PushNotifications
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

export async function disablePushNotifications(
  audiusBackendInstance: AudiusBackend
) {
  // Disabling push notifications should delete the device token
  const message = new DisablePushNotificationsMessage()
  message.send()
  const { token } = await message.receive()
  if (token) {
    await audiusBackendInstance.deregisterDeviceToken(token)
  }
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
            // Enabling push notifications should enable all of the notification types
            const message = new EnablePushNotificationsMessage()
            message.send()
            const { token, os } = yield* call(async () => message.receive())

            const newSettings = { ...initialState.pushNotifications }
            yield* put(actions.setPushNotificationSettings(newSettings))

            // We need a user for this to work (and in the case of sign up, we might not
            // have one right away when this function is called)
            // @ts-ignore: remove this ignore when waitForValue is typed
            yield* call(waitForValue, getAccountUser)
            yield* call(
              audiusBackendInstance.updatePushNotificationSettings,
              newSettings
            )
            yield* call(audiusBackendInstance.registerDeviceToken, token, os)
          } else {
            yield* call(disablePushNotifications, audiusBackendInstance)
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
  return [watchGetPushNotificationSettings, watchUpdatePushNotificationSettings]
}
