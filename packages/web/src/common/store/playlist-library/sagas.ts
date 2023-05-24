import {
  Kind,
  PlaylistIdentifier,
  PlaylistLibraryFolder,
  PlaylistLibraryIdentifier,
  makeKindId,
  accountSelectors,
  AccountCollection,
  cacheActions,
  waitForValue,
  playlistLibraryHelpers,
  playlistLibraryActions,
  PlaylistLibraryID
} from '@audius/common'
import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest
} from 'typed-redux-saga'

import { getResult } from 'common/store/confirmer/selectors'
import { updateProfileAsync } from 'common/store/profile/sagas'
import { waitForWrite } from 'utils/sagaHelpers'

import { watchAddToFolderSaga } from './watchAddToFolderSaga'
import { watchReorderLibrarySaga } from './watchReorderLibrarySaga'

const { update } = playlistLibraryActions
const {
  containsTempPlaylist,
  extractTempPlaylistsFromLibrary,
  getPlaylistsNotInLibrary,
  removePlaylistLibraryDuplicates,
  replaceTempWithResolvedPlaylists,
  removeFromPlaylistLibrary
} = playlistLibraryHelpers

const { getAccountNavigationPlaylists, getAccountUser, getPlaylistLibrary } =
  accountSelectors

const TEMP_PLAYLIST_UPDATE_HELPER = 'TEMP_PLAYLIST_UPDATE_HELPER'

/**
 * Given a temp playlist, resolves it to a proper playlist
 * @param playlist
 * @returns a playlist library identifier
 */
function* resolveTempPlaylists(
  playlist: PlaylistLibraryIdentifier | PlaylistLibraryFolder
) {
  if (playlist.type === 'temp_playlist') {
    const { playlist_id } = yield* call(
      waitForValue,
      getResult,
      {
        uid: makeKindId(Kind.COLLECTIONS, playlist.playlist_id),
        index: 0
      },
      // The playlist has been created
      (res) => Object.keys(res).length > 0
    )
    return {
      type: 'playlist',
      playlist_id
    }
  }
  return playlist
}

function* watchUpdatePlaylistLibrary() {
  yield* takeEvery(
    update.type,
    function* updatePlaylistLibrary(action: ReturnType<typeof update>) {
      yield* waitForWrite()
      const { playlistLibrary } = action.payload

      const account = yield* select(getAccountUser)
      if (!account) return

      account.playlist_library =
        removePlaylistLibraryDuplicates(playlistLibrary)
      yield* put(
        cacheActions.update(Kind.USERS, [
          {
            id: account.user_id,
            metadata: account
          }
        ])
      )

      const containsTemps = containsTempPlaylist(playlistLibrary)
      if (containsTemps) {
        // Deal with temp playlists
        // If there's a temp playlist, write to the cache, but dispatch
        // to a helper to watch for the update.
        yield* put({
          type: TEMP_PLAYLIST_UPDATE_HELPER,
          payload: { playlistLibrary }
        })
      } else {
        // Otherwise, just write the profile update
        yield* fork(updateProfileAsync, { metadata: account })
      }
    }
  )
}

/**
 * Helper to watch for updates to the library with temp playlits in it.
 * Here we intentionally take latest so that we only do one write to the
 * backend once we've resolved the temp playlist ids to actual ids
 */
function* watchUpdatePlaylistLibraryWithTempPlaylist() {
  yield* takeLatest(
    TEMP_PLAYLIST_UPDATE_HELPER,
    function* makeUpdate(action: ReturnType<typeof update>) {
      yield* waitForWrite()
      const { playlistLibrary: rawPlaylistLibrary } = action.payload
      const playlistLibrary =
        removePlaylistLibraryDuplicates(rawPlaylistLibrary)

      const account = yield* select(getAccountUser)
      if (!account) return

      // Map over playlist library contents and resolve each temp id playlist
      // to one with an actual id. Once we have the actual id, we can proceed
      // with writing the library to the user metadata (profile update)
      const tempPlaylists = extractTempPlaylistsFromLibrary(playlistLibrary)
      const resolvedPlaylists = (yield* all(
        tempPlaylists.map((playlist) => call(resolveTempPlaylists, playlist))
      )) as PlaylistLibraryIdentifier[]
      const tempPlaylistIdToResolvedPlaylist = tempPlaylists.reduce(
        (result, nextTempPlaylist, index) => ({
          ...result,
          [nextTempPlaylist.playlist_id]: resolvedPlaylists[index]
        }),
        {} as { [key: string]: PlaylistLibraryIdentifier }
      )

      playlistLibrary.contents = replaceTempWithResolvedPlaylists(
        playlistLibrary,
        tempPlaylistIdToResolvedPlaylist
      ).contents
      account.playlist_library = playlistLibrary
      // Update playlist library on chain via an account profile update
      yield* call(updateProfileAsync, { metadata: account })
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
        } as PlaylistIdentifier)
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
    watchUpdatePlaylistLibraryWithTempPlaylist,
    watchReorderLibrarySaga,
    watchAddToFolderSaga
  ]
  return sagas
}
