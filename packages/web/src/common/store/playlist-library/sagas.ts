import { updatePlaylistLibrary } from '@audius/common/api'
import {
  PlaylistLibraryID,
  PlaylistIdentifier,
  AccountCollection
} from '@audius/common/models'
import { getUserId } from '@audius/common/src/store/account/selectors'
import {
  accountSelectors,
  getContext,
  getSDK,
  playlistLibraryHelpers
} from '@audius/common/store'
import { call, select } from 'typed-redux-saga'

import { watchAddToFolderSaga } from './watchAddToFolderSaga'

const { getPlaylistsNotInLibrary, removeFromPlaylistLibrary } =
  playlistLibraryHelpers

const { getAccountNavigationPlaylists, getPlaylistLibrary } = accountSelectors

/**
 * Goes through the account playlists and adds playlists that are
 * not in the user's set playlist library
 */
export function* addPlaylistsNotInLibrary() {
  let library = yield* select(getPlaylistLibrary)
  if (!library) library = { contents: [] }
  const currentUserId = yield* select(getUserId)
  const queryClient = yield* getContext('queryClient')
  const dispatch = yield* getContext('dispatch')
  const sdk = yield* getSDK()
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
    yield* call(
      updatePlaylistLibrary,
      sdk,
      currentUserId,
      { ...library, contents: newContents },
      queryClient,
      dispatch
    )
  }
}

export function* removePlaylistFromLibrary(id: PlaylistLibraryID) {
  const library = yield* select(getPlaylistLibrary)
  if (!library) return
  const currentUserId = yield* select(getUserId)
  const queryClient = yield* getContext('queryClient')
  const dispatch = yield* getContext('dispatch')
  const sdk = yield* getSDK()
  const { library: updatedLibrary } = removeFromPlaylistLibrary(library, id)
  yield* call(
    updatePlaylistLibrary,
    sdk,
    currentUserId,
    updatedLibrary,
    queryClient,
    dispatch
  )
}

export default function sagas() {
  const sagas = [watchAddToFolderSaga]
  return sagas
}
