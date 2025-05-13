import { queryUserByHandle } from '@audius/common/api'
import { UserMetadata } from '@audius/common/models'
import { aiPageActions, FetchAiUserAction } from '@audius/common/store'
import { Maybe } from '@audius/common/utils'
import { takeEvery, call, put } from 'typed-redux-saga'

import { waitForRead } from 'utils/sagaHelpers'

import { fetchUsers } from '../../cache/users/sagas'

import tracksSagas from './lineups/tracks/sagas'

const { fetchAiUser, fetchAiUserSucceeded, fetchAiUserFailed } = aiPageActions

function* watchFetchAiUser() {
  yield takeEvery(fetchAiUser.type, fetchAiUserWorker)
}

function* fetchAiUserWorker(action: FetchAiUserAction) {
  yield* call(waitForRead)
  const { handle, userId } = action.payload

  let user: Maybe<UserMetadata> | null

  if (handle) {
    user = yield* call(queryUserByHandle, handle)
  }

  if (userId) {
    const users = yield* call(fetchUsers, [userId])
    user = users.entries[userId].metadata
  }

  if (user) {
    yield* put(fetchAiUserSucceeded({ userId: user.user_id }))
  } else {
    yield* put(fetchAiUserFailed())
  }
}

export default function sagas() {
  return [...tracksSagas(), watchFetchAiUser]
}
