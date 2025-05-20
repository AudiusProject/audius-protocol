import { queryCurrentAccount } from '@audius/common/api'
import { AccountCollection } from '@audius/common/models'
import { accountActions, accountSelectors } from '@audius/common/store'
import { call, fork, select, takeEvery } from 'typed-redux-saga'

import { addPlaylistsNotInLibrary } from 'common/store/playlist-library/sagas'
import { waitForRead } from 'utils/sagaHelpers'

import { retrieveCollections } from '../cache/collections/utils'

const { getUserId } = accountSelectors

const { signedIn, fetchSavedPlaylists } = accountActions

function* onSignedIn() {
  // Add playlists that might not have made it into the user's library.
  // This could happen if the user creates a new playlist and then leaves their session.
  yield* fork(addPlaylistsNotInLibrary)
}

function* fetchSavedPlaylistsAsync() {
  yield* waitForRead()
  const userId = yield* select(getUserId)
  const account = yield* call(queryCurrentAccount)

  // Fetch other people's playlists you've saved
  yield* fork(function* () {
    if (!account) return
    const savedPlaylists: number[] = Object.values(account.collections)
      .filter((c: AccountCollection) => !c.is_album && c.user.id !== userId)
      .map((c: AccountCollection) => c.id)
    if (savedPlaylists.length > 0) {
      yield* call(retrieveCollections, savedPlaylists, { userId })
    }
  })

  // Fetch your own playlists
  yield* fork(function* () {
    if (!account) return

    const ownPlaylists: number[] = Object.values(account.collections)
      .filter((c: AccountCollection) => !c.is_album && c.user.id === userId)
      .map((c: AccountCollection) => c.id)

    if (ownPlaylists.length > 0) {
      yield* call(retrieveCollections, ownPlaylists, { userId })
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
