import { takeEvery, put } from 'redux-saga/effects'

import * as oauthActions from 'common/store/oauth/actions'
import { MessageType } from 'services/native-mobile-interface/types'

function* watchTwitterAuth() {
  yield takeEvery(MessageType.REQUEST_TWITTER_AUTH, function* () {
    yield put(oauthActions.twitterAuth())
  })
}

function* watchInstagramAuth() {
  yield takeEvery(MessageType.REQUEST_INSTAGRAM_AUTH, function* () {
    yield put(oauthActions.instagramAuth())
  })
}

const sagas = () => {
  return [watchTwitterAuth, watchInstagramAuth]
}

export default sagas
