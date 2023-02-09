import {
  accountSelectors,
  cacheTracksSelectors,
  getContext
} from '@audius/common'
import { waitForBackendSetup } from 'audius-client/src/common/store/backend/sagas'
import { waitForRead } from 'audius-client/src/utils/sagaHelpers'
import moment from 'moment'
import { select, call, put, take } from 'typed-redux-saga'

import { isAvailableForPlay } from 'app/utils/trackUtils'

import { getOfflineTrackMetadata } from '../selectors'
import type { DownloadQueueItem, OfflineItem } from '../slice'
import {
  addOfflineItems,
  redownloadOfflineItems,
  doneLoadingFromDisk
} from '../slice'
const { getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors

const STALE_DURATION_TRACKS = moment.duration(7, 'days')

export function* updateStaleOfflineDataSaga() {
  yield* take(doneLoadingFromDisk.type)
  yield* waitForRead()
  yield* waitForBackendSetup()

  const now = Date.now()
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  const offlineItemsToRedownload: DownloadQueueItem[] = []
  const offlineItemsToUpdate: OfflineItem[] = []

  const apiClient = yield* getContext('apiClient')
  const offlineTrackMetadata = yield* select(getOfflineTrackMetadata)
  const staleTrackIds = Object.keys(offlineTrackMetadata)
    .map((id) => parseInt(id, 10))
    .filter((trackId) => {
      const metadata = offlineTrackMetadata[trackId]
      if (!metadata?.last_verified_time) return false
      return moment()
        .subtract(STALE_DURATION_TRACKS)
        .isAfter(metadata.last_verified_time)
    })

  for (const trackId of staleTrackIds) {
    const staleTrack = yield* select(getTrack, { id: trackId })
    if (!staleTrack) continue

    const updatedTrack = yield* call([apiClient, apiClient.getTrack], {
      id: trackId,
      currentUserId
    })

    if (!updatedTrack) continue

    if (!isAvailableForPlay(updatedTrack, currentUserId)) {
      // TODO purge the track and update metadatas
      // NOTE: Does the sync process cover this case?
      // Will we have an issue where the sync process sees that we are missing a track for a collection or for favorites and will try to redownload the track?
      continue
    }

    if (moment(updatedTrack.updated_at).isAfter(staleTrack.updated_at)) {
      offlineItemsToRedownload.push({
        type: 'track',
        id: trackId
      })
    }

    // Update last verified time
    offlineItemsToUpdate.push({
      type: 'track',
      id: trackId,
      metadata: {
        reasons_for_download: [],
        last_verified_time: now
      }
    })
  }

  if (offlineItemsToRedownload.length > 0) {
    yield* put(redownloadOfflineItems({ items: offlineItemsToRedownload }))
  }
  if (offlineItemsToUpdate.length > 0) {
    yield* put(addOfflineItems({ items: offlineItemsToUpdate }))
  }
}
