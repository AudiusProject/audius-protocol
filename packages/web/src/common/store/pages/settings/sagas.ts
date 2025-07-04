import {
  getUserQueryKey,
  queryAccountUser,
  queryCurrentUserId
} from '@audius/common/api'
import {
  settingsPageActions as actions,
  getContext,
  getSDK
} from '@audius/common/store'
import { getErrorMessage } from '@audius/common/utils'
import { call, put, takeEvery } from 'typed-redux-saga'

import { queryClient } from 'services/query-client'
import { waitForWrite } from 'utils/sagaHelpers'

import errorSagas from './errorSagas'

function* watchGetSettings() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* takeEvery(actions.GET_NOTIFICATION_SETTINGS, function* () {
    try {
      yield* call(waitForWrite)
      const sdk = yield* getSDK()
      const userId = yield* call(queryCurrentUserId)
      if (!userId) return

      const emailSettings = yield* call(
        audiusBackendInstance.getEmailNotificationSettings,
        { sdk }
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

      const userId = yield* call(queryCurrentUserId)

      if (userId && updateServer) {
        const sdk = yield* getSDK()
        yield* call(audiusBackendInstance.updateEmailNotificationSettings, {
          sdk,
          userId,
          emailFrequency
        })
      }
    }
  )
}

function* watchSetAiAttribution() {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const sdk = yield* getSDK()
  yield* takeEvery(
    actions.SET_AI_ATTRIBUTION,
    function* (action: actions.SetAiAttribution) {
      const { allowAiAttribution } = action
      const accountUser = yield* call(queryAccountUser)
      if (!accountUser) return
      if (accountUser.allow_ai_attribution === allowAiAttribution) return

      accountUser.allow_ai_attribution = allowAiAttribution

      yield* call(audiusBackendInstance.updateCreator, {
        metadata: accountUser,
        sdk
      })

      queryClient.setQueryData(getUserQueryKey(accountUser.user_id), {
        ...accountUser,
        allow_ai_attribution: allowAiAttribution
      })
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
