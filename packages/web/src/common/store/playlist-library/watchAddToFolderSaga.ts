import {
  accountSelectors,
  playlistLibraryActions,
  playlistLibraryHelpers,
  collectionsSocialActions,
  toastActions,
  AddToFolderAction,
  CommonState
} from '@audius/common/store'
import {} from '@audius/common'
import { Name, FavoriteSource } from '@audius/common/models'
import { takeEvery, select, put } from 'typed-redux-saga'

import { make } from '../analytics/actions'
const { toast } = toastActions

const { getPlaylistLibrary } = accountSelectors
const { addPlaylistToFolder, findInPlaylistLibrary } = playlistLibraryHelpers
const { update, addToFolder } = playlistLibraryActions
const { saveCollection } = collectionsSocialActions

const messages = {
  playlistMovedToFolderToast: (folderName: string) =>
    `This playlist was already in your library. It has now been moved to ${folderName}!`
}

export function* watchAddToFolderSaga() {
  yield* takeEvery(addToFolder.type, addToFolderWorker)
}

function* addToFolderWorker(action: AddToFolderAction) {
  const { draggingId, draggingKind, folder } = action.payload

  const playlistLibrary = yield* select(getPlaylistLibrary)
  if (!playlistLibrary) return

  const updatedLibrary = addPlaylistToFolder(
    playlistLibrary,
    draggingId,
    folder.id
  )

  const isNewAddition = yield* select(
    (state: CommonState) => !!state.account.collections[draggingId as number]
  )
  if (!isNewAddition) {
    yield* put(saveCollection(draggingId as number, FavoriteSource.NAVIGATOR))
  }

  // Show a toast if playlist dragged from outside of library was already in the library so it simply got moved to the target folder.
  if (
    draggingKind === 'playlist' &&
    findInPlaylistLibrary(playlistLibrary, draggingId)
  ) {
    yield* put(
      toast({ content: messages.playlistMovedToFolderToast(folder.name) })
    )
  }

  if (playlistLibrary !== updatedLibrary) {
    yield* put(make(Name.PLAYLIST_LIBRARY_ADD_PLAYLIST_TO_FOLDER, {}))
    yield* put(update({ playlistLibrary: updatedLibrary }))
  }
}
