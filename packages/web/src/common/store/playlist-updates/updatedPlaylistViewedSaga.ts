import {
  getContext,
  playlistUpdatesActions,
  UpdatedPlaylistViewedAction
} from '@audius/common'
import { call, takeEvery } from 'typed-redux-saga'

const { updatedPlaylistViewed } = playlistUpdatesActions

export function* watchUpdatedPlaylistViewedSaga() {
  yield* takeEvery(updatedPlaylistViewed.type, updatePlaylistLastViewedAt)
}

function* updatePlaylistLastViewedAt(action: UpdatedPlaylistViewedAction) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  yield* call(
    audiusBackendInstance.updatePlaylistLastViewedAt,
    action.payload.playlistId
  )
}
