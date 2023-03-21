import { call, takeEvery, select, put } from 'typed-redux-saga'

import { getContext } from 'store/effects'

import { getUserId } from '../account/selectors'

import {
  fetchPlaylistUpdates,
  playlistUpdatesReceived,
  updatedPlaylistViewed
} from './playlistUpdatesSlice'
import { UpdatedPlaylistViewedAction } from './types'

function* watchFetchPlaylistUpdates() {
  yield* takeEvery(
    fetchPlaylistUpdates,
    function* fetchPlaylistUpdatesWorker() {
      const currentUserId = yield* select(getUserId)
      if (!currentUserId) return

      const apiClient = yield* getContext('apiClient')

      const playlistUpdates = yield* call(
        [apiClient, apiClient.getPlaylistUpdates],
        currentUserId
      )

      if (playlistUpdates && playlistUpdates.length > 0) {
        yield* put(playlistUpdatesReceived({ playlistUpdates }))
      }
    }
  )
}

function* watchUpdatedPlaylistViewedSaga() {
  yield* takeEvery(
    updatedPlaylistViewed.type,
    function* updatePlaylistLastViewedAt(action: UpdatedPlaylistViewedAction) {
      const audiusBackendInstance = yield* getContext('audiusBackendInstance')
      yield* call(
        audiusBackendInstance.updatePlaylistLastViewedAt,
        action.payload.playlistId
      )
    }
  )
}

export default function sagas() {
  return [watchFetchPlaylistUpdates, watchUpdatedPlaylistViewedSaga]
}
