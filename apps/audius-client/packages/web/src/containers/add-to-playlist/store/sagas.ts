import { takeEvery, put } from 'redux-saga/effects'
import * as actions from './actions'
import { requiresAccount } from 'utils/sagaHelpers'
import { fetchSavedPlaylists } from 'store/account/reducer'

function* handlRequestOpen(action: ReturnType<typeof actions.requestOpen>) {
  yield put(fetchSavedPlaylists())
  yield put(actions.open(action.trackId, action.trackTitle))
}

function* watchHandleRequestOpen() {
  yield takeEvery(actions.REQUEST_OPEN, requiresAccount(handlRequestOpen))
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
