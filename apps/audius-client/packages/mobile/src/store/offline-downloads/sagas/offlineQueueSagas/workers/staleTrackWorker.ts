import type { ID } from '@audius/common'
import {
  reachabilityActions,
  getContext,
  accountSelectors,
  cacheTracksSelectors
} from '@audius/common'
import moment from 'moment'
import { put, select, call, take, race } from 'typed-redux-saga'

import { getTrackOfflineDownloadStatus } from 'app/store/offline-downloads/selectors'
import {
  completeJob,
  errorJob,
  OfflineDownloadStatus,
  redownloadOfflineItems,
  removeOfflineItems,
  requestProcessNextJob,
  startJob
} from 'app/store/offline-downloads/slice'

const { SET_UNREACHABLE } = reachabilityActions
const { getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors

export function* staleTrackWorker(trackId: ID) {
  yield* put(startJob({ type: 'stale-track', id: trackId }))
  const { jobResult, abort, cancel } = yield* race({
    jobResult: call(handleStaleTrack, trackId),
    abort: call(shouldAbortJob, trackId),
    cancel: take(SET_UNREACHABLE)
  })

  if (abort) {
    yield* put(requestProcessNextJob())
  } else if (cancel) {
    // continue
  } else if (jobResult === OfflineDownloadStatus.ERROR) {
    yield* put(errorJob({ type: 'stale-track', id: trackId }))
    yield* put(requestProcessNextJob())
  } else if (jobResult === OfflineDownloadStatus.SUCCESS) {
    yield* put(
      completeJob({
        type: 'stale-track',
        id: trackId,
        verifiedAt: Date.now()
      })
    )
    yield* put(requestProcessNextJob())
  }
}

export function* handleStaleTrack(trackId: ID) {
  const apiClient = yield* getContext('apiClient')
  const currentTrack = yield* select(getTrack, { id: trackId })
  const currentUserId = yield* select(getUserId)

  if (!currentTrack || !currentUserId) return OfflineDownloadStatus.ERROR

  const latestTrack = yield* call([apiClient, apiClient.getTrack], {
    id: trackId,
    currentUserId
  })

  if (!latestTrack) return OfflineDownloadStatus.ERROR

  if (moment(latestTrack.updated_at).isAfter(currentTrack.updated_at)) {
    yield* put(
      redownloadOfflineItems({ items: [{ type: 'track', id: trackId }] })
    )
  }

  return OfflineDownloadStatus.SUCCESS
}

function* shouldAbortJob(trackId: ID) {
  while (true) {
    yield* take(removeOfflineItems.type)
    const trackStatus = yield* select(getTrackOfflineDownloadStatus(trackId))
    if (!trackStatus) return true
  }
}
