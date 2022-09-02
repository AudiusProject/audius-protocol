import {
  getErrorMessage,
  settingsPageActions as actions,
  getContext
} from '@audius/common'
import { call, put, takeEvery } from 'typed-redux-saga'

import { waitForBackendSetup } from 'common/store/backend/sagas'

import errorSagas from './errorSagas'

function* watchGetSettings() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
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
    } catch (error) {
      yield* put(actions.getNotificationSettingsFailed(getErrorMessage(error)))
    }
  })
}

function* watchUpdateEmailFrequency() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
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
  return [watchGetSettings, watchUpdateEmailFrequency, errorSagas]
}
