import {
  CommonState,
  ReorderAction,
  accountSelectors,
  collectionsSocialActions,
  playlistLibraryActions,
  playlistLibraryHelpers
} from '@audius/common'
import { Name, FavoriteSource } from '@audius/common/models'
import { takeEvery, select, put } from 'typed-redux-saga'

import { make } from '../analytics/actions'

const { getPlaylistLibrary } = accountSelectors
const { reorderPlaylistLibrary, isInsideFolder } = playlistLibraryHelpers
const { update, reorder } = playlistLibraryActions
const { saveCollection } = collectionsSocialActions

export function* watchReorderLibrarySaga() {
  yield* takeEvery(reorder.type, reorderLibrarySagaWorker)
}

function* reorderLibrarySagaWorker(action: ReorderAction) {
  const { draggingId, droppingId, draggingKind } = action.payload

  const playlistLibrary = yield* select(getPlaylistLibrary)
  if (!playlistLibrary) return

  const updatedLibrary = reorderPlaylistLibrary(
    playlistLibrary,
    draggingId,
    droppingId,
    draggingKind
  )

  yield* put(update({ playlistLibrary: updatedLibrary }))
  yield* put(
    make(Name.PLAYLIST_LIBRARY_REORDER, {
      containsTemporaryPlaylists: false,
      kind: draggingKind
    })
  )

  // If dragging in a new playlist, save to user collections
  if (draggingKind === 'playlist' && typeof draggingId === 'number') {
    const isNewAddition = yield* select(
      (state: CommonState) => !!state.account.collections[draggingId]
    )
    if (!isNewAddition) {
      yield* put(saveCollection(draggingId, FavoriteSource.NAVIGATOR))
    }
  }

  const isDroppingIntoFolder = isInsideFolder(playlistLibrary, droppingId)
  const isIdInFolderBeforeReorder = isInsideFolder(playlistLibrary, draggingId)
  if (isIdInFolderBeforeReorder && !isDroppingIntoFolder) {
    yield* put(make(Name.PLAYLIST_LIBRARY_MOVE_PLAYLIST_OUT_OF_FOLDER, {}))
  } else if (!isIdInFolderBeforeReorder && isDroppingIntoFolder) {
    yield* put(make(Name.PLAYLIST_LIBRARY_MOVE_PLAYLIST_INTO_FOLDER, {}))
  }
}
