import { updatePlaylistLibrary } from '@audius/common/api'
import { Name, FavoriteSource } from '@audius/common/models'
import {
  accountSelectors,
  playlistLibraryActions,
  playlistLibraryHelpers,
  collectionsSocialActions,
  ReorderAction,
  CommonState,
  getContext
} from '@audius/common/store'
import { takeEvery, select, put, call } from 'typed-redux-saga'

import { make } from '../analytics/actions'

const { getPlaylistLibrary, getUserId } = accountSelectors
const { reorderPlaylistLibrary, isInsideFolder } = playlistLibraryHelpers
const { reorder } = playlistLibraryActions
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

  const currentUserId = yield* select(getUserId)
  const queryClient = yield* getContext('queryClient')
  const dispatch = yield* getContext('dispatch')
  yield* call(
    updatePlaylistLibrary,
    currentUserId,
    updatedLibrary,
    queryClient,
    dispatch
  )
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
