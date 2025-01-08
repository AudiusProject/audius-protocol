import { accountActions, accountSelectors } from '@audius/common/store'
import { call, fork, select, takeEvery } from 'typed-redux-saga'

import { addPlaylistsNotInLibrary } from 'common/store/playlist-library/sagas'
import { waitForRead } from 'utils/sagaHelpers'

import { retrieveCollections } from '../cache/collections/utils'

const { getAccountSavedPlaylistIds, getAccountOwnedPlaylistIds } =
  accountSelectors

const { signedIn, fetchSavedPlaylists } = accountActions

function* onSignedIn() {
  // Add playlists that might not have made it into the user's library.
  // This could happen if the user creates a new playlist and then leaves their session.
  yield* fork(addPlaylistsNotInLibrary)
}

function* fetchSavedPlaylistsAsync() {
  yield* waitForRead()

  // Fetch other people's playlists you've saved
  yield* fork(function* () {
    const savedPlaylists = yield* select(getAccountSavedPlaylistIds)
    if (savedPlaylists.length > 0) {
      yield* call(retrieveCollections, savedPlaylists)
    }
  })

  // Fetch your own playlists
  yield* fork(function* () {
    const ownPlaylists = yield* select(getAccountOwnedPlaylistIds)
    if (ownPlaylists.length > 0) {
      yield* call(retrieveCollections, ownPlaylists)
    }
  })
}

function* watchSignedIn() {
  yield* takeEvery(signedIn.type, onSignedIn)
}

function* watchFetchSavedPlaylists() {
  yield* takeEvery(fetchSavedPlaylists.type, fetchSavedPlaylistsAsync)
}

export default function sagas() {
  return [watchSignedIn, watchFetchSavedPlaylists]
}
