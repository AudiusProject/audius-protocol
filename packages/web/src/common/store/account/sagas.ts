import { accountActions } from '@audius/common/store'
import { fork, takeEvery } from 'typed-redux-saga'

import { addPlaylistsNotInLibrary } from 'common/store/playlist-library/sagas'

const { signedIn } = accountActions

function* onSignedIn() {
  // Add playlists that might not have made it into the user's library.
  // This could happen if the user creates a new playlist and then leaves their session.
  yield* fork(addPlaylistsNotInLibrary)
}

function* watchSignedIn() {
  yield* takeEvery(signedIn.type, onSignedIn)
}

export default function sagas() {
  return [watchSignedIn]
}
