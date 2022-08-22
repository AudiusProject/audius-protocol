import { audioRewardsPageActions } from '@audius/common'
import { takeEvery, put, takeLatest, call } from 'redux-saga/effects'

import {
  CognitoFlowResponse,
  getCognitoFlow
} from 'services/audius-backend/Cognito'
import { MessageType } from 'services/native-mobile-interface/types'
const {
  fetchCognitoFlowUrl,
  fetchCognitoFlowUrlFailed,
  fetchCognitoFlowUrlSucceeded,
  updateHCaptchaScore
} = audioRewardsPageActions

function* fetchCognitoFlowUriAsync() {
  try {
    const response: CognitoFlowResponse = yield call(getCognitoFlow)
    yield put(fetchCognitoFlowUrlSucceeded(response.shareable_url))
  } catch (e) {
    console.error(e)
    yield put(fetchCognitoFlowUrlFailed())
  }
}

function* watchFetchCognitoFlowUrl() {
  yield takeLatest(fetchCognitoFlowUrl.type, fetchCognitoFlowUriAsync)
}

function* watchUpdateHCaptchaScore() {
  yield takeEvery(
    MessageType.UPDATE_HCAPTCHA_SCORE,
    function* (action: { type: string; token: string }) {
      yield put(updateHCaptchaScore({ token: action.token }))
    }
  )
}

const sagas = () => {
  return [watchUpdateHCaptchaScore, watchFetchCognitoFlowUrl]
}

export default sagas
