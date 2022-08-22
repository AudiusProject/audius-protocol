import {
  accountActions,
  modalsActions,
  addToPlaylistUIActions as actions
} from '@audius/common'
import { takeEvery, put } from 'redux-saga/effects'

import { requiresAccount } from 'utils/sagaHelpers'
const { setVisibility } = modalsActions
const fetchSavedPlaylists = accountActions.fetchSavedPlaylists

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
