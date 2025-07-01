import { queryAccountUser, queryCurrentAccount } from '@audius/common/api'
import { PlaylistLibraryID } from '@audius/common/models'
import {
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
const { removePlaylistLibraryDuplicates, removeFromPlaylistLibrary } =
  playlistLibraryHelpers

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
