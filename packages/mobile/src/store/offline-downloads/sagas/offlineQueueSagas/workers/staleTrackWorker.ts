import {
  getContext,
  accountSelectors,
  cacheTracksSelectors
} from '@audius/common'
import type { ID } from '@audius/common/models'
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

import { shouldAbortJob } from '../../utils/shouldAbortJob'
import { shouldCancelJob } from '../../utils/shouldCancelJob'
const { getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors

export function* staleTrackWorker(trackId: ID) {
  yield* put(startJob({ type: 'stale-track', id: trackId }))
  const { jobResult, abortStaleTrack, abortJob, cancel } = yield* race({
    jobResult: call(handleStaleTrack, trackId),
    abortStaleTrack: call(shouldAbortStaleTrack, trackId),
    abortJob: call(shouldAbortJob),
    cancel: call(shouldCancelJob)
  })

  if (abortStaleTrack || abortJob) {
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
      redownloadOfflineItems({
        items: [{ type: 'track', id: trackId }]
      })
    )
  }

  return OfflineDownloadStatus.SUCCESS
}

function* shouldAbortStaleTrack(trackId: ID) {
  while (true) {
    yield* take(removeOfflineItems.type)
    const trackStatus = yield* select(getTrackOfflineDownloadStatus(trackId))
    if (!trackStatus) return true
  }
}
