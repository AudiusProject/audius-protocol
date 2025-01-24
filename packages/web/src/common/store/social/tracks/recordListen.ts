import { Name } from '@audius/common/models'
import {
  accountSelectors,
  cacheTracksSelectors,
  audioRewardsPageActions,
  tracksSocialActions,
  getContext,
  getSDK
} from '@audius/common/store'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { waitForWrite } from 'utils/sagaHelpers'

const { updateOptimisticListenStreak } = audioRewardsPageActions
const { getTrack } = cacheTracksSelectors
const { getUserId } = accountSelectors

function* recordListen(action: { trackId: number }) {
  const { trackId } = action
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* call(waitForWrite)
  const sdk = yield* getSDK()
  const userId = yield* select(getUserId)
  const track = yield* select(getTrack, { id: trackId })
  if (!userId || !track) return

  if (userId === track.owner_id && (track.listenCount ?? 0) > 10) {
    return
  }

  yield* call(audiusBackendInstance.recordTrackListen, { userId, trackId, sdk })

  yield* put(make(Name.LISTEN, { trackId }))
  if (track.is_stream_gated) {
    yield* put(make(Name.LISTEN_GATED, { trackId }))
  }

  // Optimistically update the listen streak if applicable
  yield* put(updateOptimisticListenStreak())
}

export function* watchRecordListen() {
  yield* takeEvery(tracksSocialActions.recordListen, recordListen)
}
