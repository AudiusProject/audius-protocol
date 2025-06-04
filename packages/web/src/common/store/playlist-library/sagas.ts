import {
  queryAccountUser,
  queryCurrentAccount,
  queryUser
} from '@audius/common/api'
import {
  PlaylistLibraryID,
  PlaylistIdentifier,
  AccountCollection
} from '@audius/common/models'
import {
  AccountState,
  accountActions,
  playlistLibraryActions,
  playlistLibraryHelpers
} from '@audius/common/store'
import { fork, put, takeEvery } from 'typed-redux-saga'

import { updateProfileAsync } from 'common/store/profile/sagas'
import { waitForWrite } from 'utils/sagaHelpers'

import { watchAddToFolderSaga } from './watchAddToFolderSaga'
import { watchReorderLibrarySaga } from './watchReorderLibrarySaga'

const { update } = playlistLibraryActions
const {
  getPlaylistsNotInLibrary,
  removePlaylistLibraryDuplicates,
  removeFromPlaylistLibrary
} = playlistLibraryHelpers

function* watchUpdatePlaylistLibrary() {
  yield* takeEvery(
    update.type,
    function* handleUpdatePlaylistLibrary(action: ReturnType<typeof update>) {
      yield* waitForWrite()
      const { playlistLibrary } = action.payload

      const accountUser = yield* queryAccountUser()
      if (!accountUser) return

      const updatedPlaylistLibrary =
        removePlaylistLibraryDuplicates(playlistLibrary)

      yield* put(accountActions.updatePlaylistLibrary(updatedPlaylistLibrary))

      yield* fork(updateProfileAsync, {
        metadata: { ...accountUser, playlist_library: updatedPlaylistLibrary }
      })
    }
  )
}

/**
 * Gets the account playlists while filtering out playlists by deactivated users
 * @param account - The account state
 * @returns The account playlists
 */
function* getAccountPlaylists(account: AccountState | null | undefined) {
  const playlists: { [id: number]: AccountCollection } = {}
  for (const cur of Object.keys(account?.collections ?? {})) {
    const collection = account?.collections?.[cur as unknown as number]
    if (collection?.is_album) continue
    const user = yield* queryUser(collection?.user.id)
    if (user?.is_deactivated) continue
    playlists[cur] = collection
  }
  return playlists
}

/**
 * Goes through the account playlists and adds playlists that are
 * not in the user's set playlist library
 */
export function* addPlaylistsNotInLibrary() {
  const account = yield* queryCurrentAccount()
  const library = account?.playlistLibrary ?? { contents: [] }

  const playlists = yield* getAccountPlaylists(account)
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
  const account = yield* queryCurrentAccount()
  const library = account?.playlistLibrary
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
