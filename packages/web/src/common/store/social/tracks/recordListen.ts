import {
  accountSelectors,
  audioRewardsPageActions,
  cacheTracksSelectors,
  getContext,
  Name,
  tracksSocialActions
} from '@audius/common'
import { call, put, select, takeEvery } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { waitForWrite } from 'utils/sagaHelpers'

const { updateOptimisticListenStreak } = audioRewardsPageActions
const { getTrack } = cacheTracksSelectors
const { getUserId } = accountSelectors

function* recordListen(action: { trackId: number }) {
  const { trackId } = action
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  yield* waitForWrite()
  const userId = yield* select(getUserId)
  const track = yield* select(getTrack, { id: trackId })
  if (!userId || !track) return

  yield* call(audiusBackendInstance.recordTrackListen, trackId)

  const event = make(Name.LISTEN, { trackId })
  yield* put(event)

  // Optimistically update the listen streak if applicable
  yield* put(updateOptimisticListenStreak())
}

export function* watchRecordListen() {
  yield* takeEvery(tracksSocialActions.recordListen, recordListen)
}
