import {
  accountSelectors,
  cacheTracksSelectors,
  getContext
} from '@audius/common'
import { waitForBackendSetup } from 'audius-client/src/common/store/backend/sagas'
import { waitForRead } from 'audius-client/src/utils/sagaHelpers'
import moment from 'moment'
import { select, call, put, take } from 'typed-redux-saga'

import {
  downloadTrackCoverArt,
  writeTrackJson
} from 'app/services/offline-downloader'
import { isAvailableForPlay } from 'app/utils/trackUtils'

import { getOfflineTrackMetadata } from '../selectors'
import type { OfflineItem } from '../slice'
import { doneLoadingFromDisk, addOfflineItems } from '../slice'
const { getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors

const STALE_DURATION_TRACKS = moment.duration(7, 'days')

export function* updateStaleOfflineDataSaga() {
  yield* take(doneLoadingFromDisk)
  yield* waitForRead()
  yield* waitForBackendSetup()

  const offlineTrackMetadata = yield* select(getOfflineTrackMetadata)
  const apiClient = yield* getContext('apiClient')
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  const offlineItemsToUpdate: OfflineItem[] = []

  const staleTrackIds = Object.keys(offlineTrackMetadata)
    .map((id) => parseInt(id, 10))
    .filter((trackId) => {
      const metadata = offlineTrackMetadata[trackId]
      return moment()
        .subtract(STALE_DURATION_TRACKS)
        .isAfter(metadata.download_completed_time)
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
      continue
    }

    if (moment(updatedTrack.updated_at).isAfter(staleTrack.updated_at)) {
      if (updatedTrack.cover_art_sizes !== staleTrack.cover_art_sizes) {
        yield* call(downloadTrackCoverArt, updatedTrack)
      }
    }

    // TODO: re-download the mp3 if it's changed
    yield* call(writeTrackJson, trackId.toString(), updatedTrack)

    const now = Date.now()
    offlineItemsToUpdate.push({
      type: 'track',
      id: trackId,
      metadata: {
        download_completed_time: now,
        last_verified_time: now,
        reasons_for_download: []
      }
    })
  }
  yield* put(addOfflineItems({ items: offlineItemsToUpdate }))
}
