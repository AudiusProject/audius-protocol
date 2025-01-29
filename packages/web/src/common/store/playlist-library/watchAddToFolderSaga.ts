import { updatePlaylistLibrary } from '@audius/common/api'
import { Name, FavoriteSource } from '@audius/common/models'
import {
  accountSelectors,
  playlistLibraryActions,
  playlistLibraryHelpers,
  collectionsSocialActions,
  toastActions,
  AddToFolderAction,
  CommonState,
  getContext,
  getSDK
} from '@audius/common/store'
import { takeEvery, select, put, call } from 'typed-redux-saga'

import { make } from '../analytics/actions'
const { toast } = toastActions

const { getPlaylistLibrary, getUserId } = accountSelectors
const { addPlaylistToFolder, findInPlaylistLibrary } = playlistLibraryHelpers
const { addToFolder } = playlistLibraryActions
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

  const sdk = yield* getSDK()
  if (playlistLibrary !== updatedLibrary) {
    yield* put(make(Name.PLAYLIST_LIBRARY_ADD_PLAYLIST_TO_FOLDER, {}))
    const currentUserId = yield* select(getUserId)
    const queryClient = yield* getContext('queryClient')
    const dispatch = yield* getContext('dispatch')
    yield* call(
      updatePlaylistLibrary,
      sdk,
      currentUserId,
      updatedLibrary,
      queryClient,
      dispatch
    )
  }
}
