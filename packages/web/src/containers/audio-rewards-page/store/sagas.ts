import { call, put, select, takeEvery } from 'redux-saga/effects'

import { getUserId } from 'common/store/account/selectors'
import {
  HCaptchaStatus,
  setHCaptchaStatus,
  updateHCaptchaScore,
  fetchUserChallenges,
  fetchUserChallengesFailed,
  fetchUserChallengesSucceeded
} from 'common/store/pages/audio-rewards/slice'
import mobileSagas from 'containers/audio-rewards-page/store/mobileSagas'
import AudiusBackend from 'services/AudiusBackend'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { waitForBackendSetup } from 'store/backend/sagas'

import { UserChallenge } from '../../../common/models/AudioRewards'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

export function* watchFetchUserChallenges() {
  yield takeEvery(fetchUserChallenges.type, function* () {
    yield call(waitForBackendSetup)
    const currentUserId: number = yield select(getUserId)

    try {
      const userChallenges: UserChallenge[] = yield apiClient.getUserChallenges(
        {
          userID: currentUserId
        }
      )
      yield put(fetchUserChallengesSucceeded({ userChallenges }))
    } catch (e) {
      console.error(e)
      yield put(fetchUserChallengesFailed())
    }
  })
}

function* watchUpdateHCaptchaScore() {
  yield takeEvery(updateHCaptchaScore.type, function* (
    action: ReturnType<typeof updateHCaptchaScore>
  ): any {
    const { token } = action.payload
    const result = yield call(AudiusBackend.updateHCaptchaScore, token)
    if (result.error) {
      yield put(setHCaptchaStatus({ status: HCaptchaStatus.ERROR }))
    } else {
      yield put(setHCaptchaStatus({ status: HCaptchaStatus.SUCCESS }))
    }
  })
}

const sagas = () => {
  const sagas = [watchFetchUserChallenges, watchUpdateHCaptchaScore]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}

export default sagas
