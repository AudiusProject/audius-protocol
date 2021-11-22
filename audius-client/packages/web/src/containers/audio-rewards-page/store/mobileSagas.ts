import { takeEvery, put } from 'redux-saga/effects'

import { updateHCaptchaScore } from 'common/store/pages/audio-rewards/slice'
import { MessageType } from 'services/native-mobile-interface/types'

function* watchUpdateHCaptchaScore() {
  yield takeEvery(MessageType.UPDATE_HCAPTCHA_SCORE, function* (action: {
    type: string
    token: string
  }) {
    yield put(updateHCaptchaScore({ token: action.token }))
  })
}

const sagas = () => {
  return [watchUpdateHCaptchaScore]
}

export default sagas
