import { call, takeEvery, select, put } from 'typed-redux-saga'

import { Name } from '~/models/Analytics'
import { getContext } from '~/store/effects'

import { getUserId } from '../account/selectors'

import { selectPlaylistUpdatesTotal } from './playlistUpdatesSelectors'
import {
  fetchPlaylistUpdates,
  playlistUpdatesReceived,
  updatedPlaylistViewed
} from './playlistUpdatesSlice'
import { UpdatedPlaylistViewedAction } from './types'

function* watchFetchPlaylistUpdates() {
  yield* takeEvery(fetchPlaylistUpdates, fetchPlaylistUpdatesWorker)
}

function* fetchPlaylistUpdatesWorker() {
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  const apiClient = yield* getContext('apiClient')
  const existingUpdatesTotal = yield* select(selectPlaylistUpdatesTotal)

  const playlistUpdates = yield* call(
    [apiClient, apiClient.getPlaylistUpdates],
    currentUserId
  )

  if (!playlistUpdates) return

  const currentUpdatesTotal = playlistUpdates.length

  if (currentUpdatesTotal !== existingUpdatesTotal) {
    yield* put(playlistUpdatesReceived({ playlistUpdates }))
    yield* put({
      type: 'ANALYTICS/TRACK',
      eventName: Name.PLAYLIST_LIBRARY_HAS_UPDATE,
      count: currentUpdatesTotal
    })
  }
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
