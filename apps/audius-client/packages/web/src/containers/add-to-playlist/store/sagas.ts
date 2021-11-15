import { takeEvery, put } from 'redux-saga/effects'

import { fetchSavedPlaylists } from 'common/store/account/reducer'
import { requiresAccount } from 'utils/sagaHelpers'

import * as actions from '../../../common/store/ui/add-to-playlist/actions'

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
