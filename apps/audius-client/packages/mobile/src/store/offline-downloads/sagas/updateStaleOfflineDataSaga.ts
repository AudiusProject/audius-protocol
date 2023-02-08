import {
  accountSelectors,
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  getContext
} from '@audius/common'
import { waitForBackendSetup } from 'audius-client/src/common/store/backend/sagas'
import { waitForRead } from 'audius-client/src/utils/sagaHelpers'
import moment from 'moment'
import { select, call, put, take } from 'typed-redux-saga'

import { isAvailableForPlay } from 'app/utils/trackUtils'

import {
  getOfflineCollectionMetadata,
  getOfflineTrackMetadata,
  getOfflineTrackStatus
} from '../selectors'
import type { DownloadQueueItem, OfflineItem } from '../slice'
import {
  removeOfflineItems,
  OfflineDownloadStatus,
  addOfflineItems,
  redownloadOfflineItems,
  doneLoadingFromDisk
} from '../slice'
const { getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors

const STALE_DURATION_TRACKS = moment.duration(7, 'days')

export function* updateStaleOfflineDataSaga() {
  yield* take(doneLoadingFromDisk)
  yield* waitForRead()
  yield* waitForBackendSetup()

  const now = Date.now()
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return

  const offlineItemsToRedownload: DownloadQueueItem[] = []
  const offlineItemsToUpdate: OfflineItem[] = []
  const offlineItemsToRemove: OfflineItem[] = []

  // - Tracks -
  const apiClient = yield* getContext('apiClient')
  const offlineTrackMetadata = yield* select(getOfflineTrackMetadata)
  const staleTrackIds = Object.keys(offlineTrackMetadata)
    .map((id) => parseInt(id, 10))
    .filter((trackId) => {
      const metadata = offlineTrackMetadata[trackId]
      if (!metadata.last_verified_time) return false
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
    offlineItemsToUpdate.push({
      type: 'track',
      id: trackId,
      metadata: {
        reasons_for_download: [],
        // TODO: See if this can be remove/why is this necessary here
        download_completed_time:
          offlineTrackMetadata[trackId].download_completed_time,
        // Updating the last_verified_time for all of the track offline metadatas
        last_verified_time: now
      }
    })
  }

  const offlineTrackStatus = yield* select(getOfflineTrackStatus)

  // - Collections -
  const offlineCollectionMetadata = yield* select(getOfflineCollectionMetadata)
  const collectionIds = Object.keys(offlineCollectionMetadata).map((id) =>
    parseInt(id, 10)
  )

  for (const collectionId of collectionIds) {
    const currentCollection = yield* select(getCollection, { id: collectionId })
    if (!currentCollection) continue

    const [newCollection] = yield* call([apiClient, apiClient.getPlaylist], {
      playlistId: collectionId,
      currentUserId
    })
    if (!newCollection) continue

    if (
      moment(newCollection.updated_at).isAfter(currentCollection.updated_at)
    ) {
      const collectionMetadata = offlineCollectionMetadata[collectionId]

      // Mark the collection for redownload to update the artwork and metadata
      offlineItemsToRedownload.push({ type: 'collection', id: collectionId })

      const downloadedCollectionTrackIds = new Set(
        currentCollection.tracks
          ?.map((track) => track.track_id)
          ?.filter((trackId) => {
            const downloadStatus = offlineTrackStatus[trackId]
            return (
              downloadStatus === OfflineDownloadStatus.SUCCESS ||
              downloadStatus === OfflineDownloadStatus.LOADING ||
              downloadStatus === OfflineDownloadStatus.INIT
            )
          }) ?? []
      )

      const newCollectionTrackIds = new Set(
        newCollection.tracks?.map((track) => track.track_id)
      )

      const trackDownloadReasons =
        collectionMetadata?.reasons_for_download.map((reason) => ({
          collection_id: collectionId,
          is_from_favorites: reason.is_from_favorites
        })) ?? []

      // Add track ids for added tracks to update offline items array
      const addedTrackIds = [...newCollectionTrackIds].filter(
        (trackId) => !downloadedCollectionTrackIds.has(trackId)
      )
      for (const addedTrackId of addedTrackIds) {
        offlineItemsToUpdate.push({
          type: 'track',
          id: addedTrackId,
          metadata: {
            reasons_for_download: trackDownloadReasons
          }
        })
      }

      // Add track ids for removed tracks to remove offline items array
      const removedTrackIds = [...downloadedCollectionTrackIds].filter(
        (trackId) => !newCollectionTrackIds.has(trackId)
      )
      for (const removedTrackId of removedTrackIds) {
        offlineItemsToRemove.push({
          type: 'track',
          id: removedTrackId,
          metadata: {
            reasons_for_download: trackDownloadReasons
          }
        })
      }
    }
  }

  yield* put(redownloadOfflineItems({ items: offlineItemsToRedownload }))
  yield* put(addOfflineItems({ items: offlineItemsToUpdate }))
  yield* put(removeOfflineItems({ items: offlineItemsToRemove }))
}
