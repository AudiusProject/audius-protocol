import { accountActions } from '@audius/common/store/account'
import { modalsActions } from '@audius/common/store/ui'
import {
  REQUEST_OPEN,
  requestOpen,
  open
} from '@audius/common/store/ui/add-to-playlist/actions'
import { takeEvery, put } from 'redux-saga/effects'

import { requiresAccount } from 'common/utils/requiresAccount'

const { setVisibility } = modalsActions
const fetchSavedPlaylists = accountActions.fetchSavedPlaylists

function* handleRequestOpen(action: ReturnType<typeof requestOpen>) {
  yield put(fetchSavedPlaylists())
  yield put(open(action.trackId, action.trackTitle, action.isUnlisted))
  yield put(setVisibility({ modal: 'AddToPlaylist', visible: true }))
}

function* watchHandleRequestOpen() {
  yield takeEvery(REQUEST_OPEN, requiresAccount(handleRequestOpen))
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
