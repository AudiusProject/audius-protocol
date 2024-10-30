import { Kind } from '@audius/common/models'
import {
  accountSelectors,
  cacheActions,
  settingsPageActions as actions,
  getContext
} from '@audius/common/store'
import { getErrorMessage } from '@audius/common/utils'
import { call, put, takeEvery, select } from 'typed-redux-saga'

import { waitForWrite } from 'utils/sagaHelpers'

import errorSagas from './errorSagas'

const { getAccountUser, getUserId } = accountSelectors

function* watchGetSettings() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(actions.GET_NOTIFICATION_SETTINGS, function* () {
    try {
      yield* call(waitForWrite)
      const userId = yield* select(getUserId)
      if (!userId) return

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
      const { frequency: emailFrequency, updateServer } = action

      const userId = yield* select(getUserId)

      if (userId && updateServer) {
        yield* call(audiusBackendInstance.updateEmailNotificationSettings, {
          userId,
          emailFrequency
        })
      }
    }
  )
}

function* watchSetAiAttribution() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(
    actions.SET_AI_ATTRIBUTION,
    function* (action: actions.SetAiAttribution) {
      const { allowAiAttribution } = action
      const accountUser = yield* select(getAccountUser)
      if (!accountUser) return
      if (accountUser.allow_ai_attribution === allowAiAttribution) return

      accountUser.allow_ai_attribution = allowAiAttribution

      yield* call(
        audiusBackendInstance.updateCreator,
        accountUser,
        accountUser.user_id
      )

      yield* put(
        cacheActions.update(Kind.USERS, [
          {
            id: accountUser.user_id,
            metadata: { allow_ai_attribution: allowAiAttribution }
          }
        ])
      )
    }
  )
}

export default function sagas() {
  return [
    watchGetSettings,
    watchUpdateEmailFrequency,
    watchSetAiAttribution,
    errorSagas
  ]
}
