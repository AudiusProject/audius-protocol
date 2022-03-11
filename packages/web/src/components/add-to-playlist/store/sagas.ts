import { takeEvery, put } from 'redux-saga/effects'

import { fetchSavedPlaylists } from 'common/store/account/reducer'
import * as actions from 'common/store/ui/add-to-playlist/actions'
import { setVisibility } from 'common/store/ui/modals/slice'
import { requiresAccount } from 'utils/sagaHelpers'

function* handleRequestOpen(action: ReturnType<typeof actions.requestOpen>) {
  yield put(fetchSavedPlaylists())
  yield put(actions.open(action.trackId, action.trackTitle))
  yield put(setVisibility({ modal: 'AddToPlaylist', visible: true }))
}

function* watchHandleRequestOpen() {
  yield takeEvery(actions.REQUEST_OPEN, requiresAccount(handleRequestOpen))
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
