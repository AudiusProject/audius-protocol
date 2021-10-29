import { takeEvery, put } from 'redux-saga/effects'

import { MessageType } from 'services/native-mobile-interface/types'
import * as oauthActions from 'store/oauth/actions'

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
