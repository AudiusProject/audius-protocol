import type { DownloadReason, ID } from '@audius/common'
import {
  reachabilityActions,
  cacheCollectionsSelectors,
  accountSelectors,
  getContext
} from '@audius/common'
import { difference } from 'lodash'
import moment from 'moment'
import { call, put, race, select, take } from 'typed-redux-saga'

import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'
import { dispatch } from 'app/store/store'

import {
  getCollectionSyncStatus,
  getOfflineCollectionMetadata,
  getOfflineTrackMetadata
} from '../../../selectors'
import type { CollectionId, OfflineItem } from '../../../slice'
import {
  completeCollectionSync,
  CollectionSyncStatus,
  errorCollectionSync,
  cancelCollectionSync,
  requestDownloadQueuedItem,
  redownloadOfflineItems,
  addOfflineItems,
  removeOfflineItems,
  startCollectionSync
} from '../../../slice'

const { SET_UNREACHABLE } = reachabilityActions
const { getUserId } = accountSelectors
const { getCollection } = cacheCollectionsSelectors

const isTrackFavoriteReason = (downloadReason: DownloadReason) =>
  downloadReason.is_from_favorites &&
  downloadReason.collection_id === DOWNLOAD_REASON_FAVORITES

function* shouldCancelSync(collectionId: CollectionId) {
  while (true) {
    yield* take(removeOfflineItems.type)
    const syncStatus = yield* select(getCollectionSyncStatus, collectionId)
    if (!syncStatus) return true
  }
}

export function* syncCollectionWorker(collectionId: CollectionId) {
  yield* put(startCollectionSync({ id: collectionId }))

  const { syncCollection, cancel, unreachable } = yield* race({
    syncCollection: call(syncCollectionAsync, collectionId),
    cancel: call(shouldCancelSync, collectionId),
    unreachable: take(SET_UNREACHABLE)
  })

  if (cancel) {
    yield* put(requestDownloadQueuedItem())
  } else if (unreachable) {
    yield* put(cancelCollectionSync({ id: collectionId }))
  } else if (syncCollection === CollectionSyncStatus.ERROR) {
    yield* put(errorCollectionSync({ id: collectionId }))
    yield* put(requestDownloadQueuedItem())
  } else if (syncCollection === CollectionSyncStatus.SUCCESS) {
    yield* put(completeCollectionSync({ id: collectionId }))
    yield* put(requestDownloadQueuedItem())
  }
}

function* syncCollectionAsync(collectionId: CollectionId) {
  if (collectionId === DOWNLOAD_REASON_FAVORITES) {
    return yield* call(syncFavoritesCollection)
  } else {
    return yield* call(syncCollection, collectionId)
  }
}

function* syncFavoritesCollection() {
  const currentUserId = yield* select(getUserId)
  const apiClient = yield* getContext('apiClient')
  if (!currentUserId) return CollectionSyncStatus.ERROR
  const offlineTrackMetadata = yield* select(getOfflineTrackMetadata)

  const latestFavoritedTracks = yield* call(
    [apiClient, apiClient.getFavorites],
    { currentUserId, limit: 10000 }
  )

  if (!latestFavoritedTracks) return CollectionSyncStatus.ERROR

  const offlineFavoritedTrackIds = Object.keys(offlineTrackMetadata)
    .map((id) => parseInt(id, 10))
    .filter((id) =>
      offlineTrackMetadata[id].reasons_for_download.some(isTrackFavoriteReason)
    )

  const latestFavoritedTrackIds = latestFavoritedTracks.map(
    (favorite) => favorite.save_item_id
  )

  // Remove
  const trackIdsToRemove = difference(
    offlineFavoritedTrackIds,
    latestFavoritedTrackIds
  )

  const tracksToRemove: OfflineItem[] = trackIdsToRemove.map((trackId) => ({
    type: 'track',
    id: trackId,
    metadata: {
      reasons_for_download: [
        { is_from_favorites: true, collection_id: DOWNLOAD_REASON_FAVORITES }
      ]
    }
  }))

  if (tracksToRemove.length > 0) {
    yield* put(removeOfflineItems({ items: tracksToRemove }))
  }

  // Add
  const trackIdsToAdd = difference(
    latestFavoritedTrackIds,
    offlineFavoritedTrackIds
  )

  const tracksToAdd: OfflineItem[] = trackIdsToAdd.map((trackId) => ({
    type: 'track',
    id: trackId,
    metadata: {
      reasons_for_download: [
        { is_from_favorites: true, collection_id: DOWNLOAD_REASON_FAVORITES }
      ]
    }
  }))

  if (tracksToAdd.length > 0) {
    yield* put(addOfflineItems({ items: tracksToAdd }))
  }

  return CollectionSyncStatus.SUCCESS
}

function* syncCollection(collectionId: ID) {
  const currentUserId = yield* select(getUserId)
  const apiClient = yield* getContext('apiClient')
  const currentCollection = yield* select(getCollection, { id: collectionId })
  if (!currentCollection || !currentUserId) return CollectionSyncStatus.ERROR

  const latestCollection = yield* call(
    [apiClient, apiClient.getCollectionMetadata],
    {
      collectionId,
      currentUserId
    }
  )

  if (!latestCollection) return CollectionSyncStatus.ERROR

  if (
    !moment(latestCollection.updated_at).isAfter(currentCollection.updated_at)
  ) {
    return CollectionSyncStatus.SUCCESS
  }

  dispatch(
    redownloadOfflineItems({
      items: [{ type: 'collection', id: collectionId }]
    })
  )

  const currentCollectionTrackIds =
    currentCollection.playlist_contents.track_ids.map(({ track }) => track)

  const latestCollectionTrackIds =
    latestCollection.playlist_contents.track_ids.map(({ track }) => track)

  const offlineCollectionMetadata = yield* select(getOfflineCollectionMetadata)
  const currentOfflineCollectionMetadata =
    offlineCollectionMetadata[collectionId]

  if (!currentOfflineCollectionMetadata) return CollectionSyncStatus.ERROR

  const trackDownloadReasons =
    currentOfflineCollectionMetadata.reasons_for_download.map(
      ({ is_from_favorites }) => ({
        collection_id: collectionId,
        is_from_favorites
      })
    )

  // Remove tracks
  const tracksIdsToRemove = difference(
    currentCollectionTrackIds,
    latestCollectionTrackIds
  )

  const trackItemsToRemove: OfflineItem[] = tracksIdsToRemove.map(
    (trackId) => ({
      type: 'track',
      id: trackId,
      metadata: { reasons_for_download: trackDownloadReasons }
    })
  )

  dispatch(removeOfflineItems({ items: trackItemsToRemove }))

  // Add tracks
  const trackIdsToAdd = difference(
    latestCollectionTrackIds,
    currentCollectionTrackIds
  )

  const trackItemsToAdd: OfflineItem[] = trackIdsToAdd.map((trackId) => ({
    type: 'track',
    id: trackId,
    metadata: { reasons_for_download: trackDownloadReasons }
  }))

  dispatch(addOfflineItems({ items: trackItemsToAdd }))

  return CollectionSyncStatus.SUCCESS
}
