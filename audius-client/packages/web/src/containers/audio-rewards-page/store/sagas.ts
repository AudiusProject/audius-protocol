import { call, put, select, takeEvery } from 'redux-saga/effects'

import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { getUserId } from 'store/account/selectors'
import { waitForBackendSetup } from 'store/backend/sagas'

import { UserChallenge } from '../types'

import {
  fetchUserChallenges,
  fetchUserChallengesFailed,
  fetchUserChallengesSucceeded
} from './slice'

export function* watchFetchUserChallenges() {
  yield takeEvery(fetchUserChallenges.type, function* () {
    yield call(waitForBackendSetup)
    const currentUserId: number = yield select(getUserId)

    const userChallenges: UserChallenge[] = yield apiClient.getUserChallenges({
      userID: currentUserId
    })

    try {
      yield put(fetchUserChallengesSucceeded({ userChallenges }))
    } catch (e) {
      console.error(e)
      yield put(fetchUserChallengesFailed())
    }
  })
}

const sagas = () => {
  return [watchFetchUserChallenges]
}

export default sagas
