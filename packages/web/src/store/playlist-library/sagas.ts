import {
  ID,
  Kind,
  PlaylistIdentifier,
  PlaylistLibrary,
  PlaylistLibraryFolder,
  PlaylistLibraryIdentifier,
  User,
  makeKindId
} from '@audius/common'
import {
  all,
  call,
  fork,
  put,
  select,
  takeEvery,
  takeLatest
} from 'redux-saga/effects'

import { AccountCollection } from 'common/store/account/reducer'
import {
  getAccountNavigationPlaylists,
  getAccountUser,
  getPlaylistLibrary
} from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import {
  containsTempPlaylist,
  extractTempPlaylistsFromLibrary,
  getPlaylistsNotInLibrary,
  removePlaylistLibraryDuplicates,
  replaceTempWithResolvedPlaylists
} from 'common/store/playlist-library/helpers'
import { updateProfileAsync } from 'pages/profile-page/sagas'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getResult } from 'store/confirmer/selectors'
import { waitForValue } from 'utils/sagaHelpers'

import { update } from './slice'

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
    const { playlist_id }: { playlist_id: ID } = yield call(
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
  yield takeEvery(
    update.type,
    function* updatePlaylistLibrary(action: ReturnType<typeof update>) {
      const { playlistLibrary } = action.payload
      yield call(waitForBackendSetup)

      const account: User = yield select(getAccountUser)
      account.playlist_library =
        removePlaylistLibraryDuplicates(playlistLibrary)
      yield put(
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
        yield put({
          type: TEMP_PLAYLIST_UPDATE_HELPER,
          payload: { playlistLibrary }
        })
      } else {
        // Otherwise, just write the profile update
        yield fork(updateProfileAsync, { metadata: account })
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
  yield takeLatest(
    TEMP_PLAYLIST_UPDATE_HELPER,
    function* makeUpdate(action: ReturnType<typeof update>) {
      const { playlistLibrary: rawPlaylistLibrary } = action.payload
      const playlistLibrary =
        removePlaylistLibraryDuplicates(rawPlaylistLibrary)
      const account: User = yield select(getAccountUser)

      // Map over playlist library contents and resolve each temp id playlist
      // to one with an actual id. Once we have the actual id, we can proceed
      // with writing the library to the user metadata (profile update)
      const tempPlaylists = extractTempPlaylistsFromLibrary(playlistLibrary)
      const resolvedPlaylists: PlaylistLibraryIdentifier[] = yield all(
        tempPlaylists.map((playlist) => call(resolveTempPlaylists, playlist))
      )
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
      yield call(updateProfileAsync, { metadata: account })
    }
  )
}

/**
 * Goes through the account playlists and adds playlists that are
 * not in the user's set playlist library
 */
export function* addPlaylistsNotInLibrary() {
  let library: PlaylistLibrary = yield select(getPlaylistLibrary)
  if (!library) library = { contents: [] }
  const playlists: { [id: number]: AccountCollection } = yield select(
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
    const newContents = library.contents.concat(newEntries)
    yield put(
      update({ playlistLibrary: { ...library, contents: newContents } })
    )
  }
}

export default function sagas() {
  const sagas = [
    watchUpdatePlaylistLibrary,
    watchUpdatePlaylistLibraryWithTempPlaylist
  ]
  return sagas
}
