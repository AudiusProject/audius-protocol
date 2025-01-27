import {
  PlaylistLibraryID,
  PlaylistIdentifier,
  AccountCollection
} from '@audius/common/models'
import {
  accountSelectors,
  accountActions,
  playlistLibraryActions,
  playlistLibraryHelpers
} from '@audius/common/store'
import { put, select, takeEvery } from 'typed-redux-saga'

import { waitForWrite } from 'utils/sagaHelpers'

import { watchAddToFolderSaga } from './watchAddToFolderSaga'
import { watchReorderLibrarySaga } from './watchReorderLibrarySaga'

const { update } = playlistLibraryActions
const {
  getPlaylistsNotInLibrary,
  removePlaylistLibraryDuplicates,
  removeFromPlaylistLibrary
} = playlistLibraryHelpers

const { getAccountNavigationPlaylists, getAccountUser, getPlaylistLibrary } =
  accountSelectors

function* watchUpdatePlaylistLibrary() {
  yield* takeEvery(
    update.type,
    function* handleUpdatePlaylistLibrary(action: ReturnType<typeof update>) {
      yield* waitForWrite()
      const { playlistLibrary } = action.payload

      const account = yield* select(getAccountUser)
      if (!account) return

      const updatedPlaylistLibrary =
        removePlaylistLibraryDuplicates(playlistLibrary)

      yield* put(accountActions.updatePlaylistLibrary(updatedPlaylistLibrary))

      // feature-tan-query TODO: update user playlist_library
      // yield* fork(updateProfileAsync, {
      //   metadata: { ...account, playlist_library: updatedPlaylistLibrary }
      // })
    }
  )
}

/**
 * Goes through the account playlists and adds playlists that are
 * not in the user's set playlist library
 */
export function* addPlaylistsNotInLibrary() {
  let library = yield* select(getPlaylistLibrary)
  if (!library) library = { contents: [] }
  const playlists: { [id: number]: AccountCollection } = yield* select(
    getAccountNavigationPlaylists
  )
  const notInLibrary = getPlaylistsNotInLibrary(library, playlists)
  if (Object.keys(notInLibrary).length > 0) {
    const newEntries = Object.values(notInLibrary).map(
      (playlist) =>
        ({
          playlist_id: playlist.id,
          type: 'playlist'
        }) as PlaylistIdentifier
    )
    const newContents = [...newEntries, ...library.contents]
    yield* put(
      update({ playlistLibrary: { ...library, contents: newContents } })
    )
  }
}

export function* removePlaylistFromLibrary(id: PlaylistLibraryID) {
  const library = yield* select(getPlaylistLibrary)
  if (!library) return
  const { library: updatedLibrary } = removeFromPlaylistLibrary(library, id)
  yield* put(update({ playlistLibrary: updatedLibrary }))
}

export default function sagas() {
  const sagas = [
    watchUpdatePlaylistLibrary,
    watchReorderLibrarySaga,
    watchAddToFolderSaga
  ]
  return sagas
}
