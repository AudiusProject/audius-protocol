import type { ID } from '@audius/common'
import { partition } from 'lodash'
import { takeEvery, select, put, call } from 'typed-redux-saga'

import type {
  CollectionForDownload,
  TrackForDownload
} from 'app/services/offline-downloader'
import {
  DOWNLOAD_REASON_FAVORITES,
  cancelQueuedCollectionDownloads,
  cancelQueuedDownloads
} from 'app/services/offline-downloader'

import {
  getAllOfflineCollections,
  getAllOfflineFavoritedCollections,
  getOfflineTracks
} from '../selectors'
import type {
  CollectionId,
  CollectionReasonsToUpdate,
  TrackReasonsToUpdate
} from '../slice'
import {
  OfflineDownloadStatus,
  updateCollectionDownloadReasons,
  removeCollectionDownloads,
  updateTrackDownloadReasons,
  removeTrackDownloads,
  removeAllDownloadedFavorites
} from '../slice'

/*
 * Saga initiated when user has requested to un-download their favorites.
 * This includes the "favorites" collection and all collections that were
 * not explicitly downloaded by the user previously.
 */
export function* watchRemoveAllDownloadedFavorites() {
  yield* takeEvery(
    removeAllDownloadedFavorites.type,
    removeAllDownloadedFavoritesWorker
  )
}

function* removeAllDownloadedFavoritesWorker() {
  const { collectionsToRemove, collectionsToUpdate, collectionsToDequeue } =
    yield* call(removeFavoritedCollections)

  const { tracksToRemove, tracksToUpdate, tracksToDequeue } = yield* call(
    removeFavoritedTracks
  )

  if (collectionsToRemove.length > 0) {
    yield* put(
      removeCollectionDownloads({ collectionIds: collectionsToRemove })
    )
  }
  if (collectionsToUpdate.length > 0) {
    yield* put(
      updateCollectionDownloadReasons({ reasons: collectionsToUpdate })
    )
  }

  if (tracksToRemove.length > 0) {
    yield* put(removeTrackDownloads({ trackIds: tracksToRemove }))
  }

  if (tracksToUpdate.length > 0) {
    yield* put(updateTrackDownloadReasons({ reasons: tracksToUpdate }))
  }

  yield* call(cancelQueuedCollectionDownloads, collectionsToDequeue)
  yield* call(cancelQueuedDownloads, tracksToDequeue)
}

function* removeFavoritedCollections() {
  const offlineCollections = yield* select(getAllOfflineCollections)
  const offlineFavoritedCollections = yield* select(
    getAllOfflineFavoritedCollections
  )
  const offlineFavoritedCollectionIds = Object.keys(offlineFavoritedCollections)

  const collectionsToRemove: CollectionId[] = [DOWNLOAD_REASON_FAVORITES]
  const collectionsToUpdate: CollectionReasonsToUpdate[] = []
  const collectionsToDequeue: CollectionForDownload[] =
    offlineFavoritedCollectionIds
      .filter((collectionId) => collectionId !== DOWNLOAD_REASON_FAVORITES)
      .map((collectionId) => ({
        collectionId: parseInt(collectionId, 10),
        isFavoritesDownload: true
      }))

  offlineFavoritedCollectionIds.forEach((favoritedCollectionId) => {
    const offlineCollectionStatus = offlineCollections[favoritedCollectionId]
    const isAlsoOfflineCollection =
      offlineCollectionStatus &&
      offlineCollectionStatus !== OfflineDownloadStatus.INIT

    if (isAlsoOfflineCollection) {
      collectionsToUpdate.push({
        collectionId: parseInt(favoritedCollectionId, 10),
        isFavoritesDownload: false
      })
    } else {
      collectionsToRemove.push(parseInt(favoritedCollectionId, 10))
    }
  })

  return { collectionsToRemove, collectionsToUpdate, collectionsToDequeue }
}

function* removeFavoritedTracks() {
  const offlineTracks = yield* select(getOfflineTracks)

  const tracksToRemove: ID[] = []
  const tracksToUpdate: TrackReasonsToUpdate[] = []
  const tracksToDequeue: TrackForDownload[] = []

  const offlineFavoritedCollections = yield* select(
    getAllOfflineFavoritedCollections
  )

  const favoritedCollectionIds = new Set([
    'favorites',
    ...Object.keys(offlineFavoritedCollections)
  ])

  for (const offlineTrack of offlineTracks) {
    const { track_id, offline } = offlineTrack
    if (!offline) continue

    const { reasons_for_download } = offline

    const [deletedReasons, remainingReasons] = partition(
      reasons_for_download,
      (reason) => {
        const { is_from_favorites, collection_id } = reason
        return (
          is_from_favorites &&
          collection_id &&
          favoritedCollectionIds.has(collection_id)
        )
      }
    )

    tracksToDequeue.push(
      ...deletedReasons.map((downloadReason) => ({
        trackId: track_id,
        downloadReason
      }))
    )

    if (remainingReasons.length === 0) {
      tracksToRemove.push(track_id)
    } else if (remainingReasons.length < reasons_for_download.length) {
      tracksToUpdate.push({
        trackId: track_id,
        reasons_for_download: remainingReasons
      })
    }
  }

  return { tracksToRemove, tracksToUpdate, tracksToDequeue }
}
