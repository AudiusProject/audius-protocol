import type { UserCollectionMetadata } from '@audius/common'
import {
  FavoriteSource,
  tracksSocialActions,
  collectionsSocialActions,
  accountSelectors
} from '@audius/common'
import { takeLatest, call, select, takeEvery } from 'typed-redux-saga'

import { apiClient } from 'app/services/audius-api-client'
import {
  purgeAllDownloads,
  batchDownloadTrack,
  downloadCollectionById,
  DOWNLOAD_REASON_FAVORITES
} from 'app/services/offline-downloader'

import { getOfflineCollections } from './selectors'
import { clearOfflineDownloads } from './slice'
const { getUserId } = accountSelectors

export function* downloadSavedTrack(
  action: ReturnType<typeof tracksSocialActions.saveTrack>
) {
  const offlineCollections = yield* select(getOfflineCollections)
  if (!offlineCollections[DOWNLOAD_REASON_FAVORITES]) return
  batchDownloadTrack([
    {
      trackId: action.trackId,
      downloadReason: {
        is_from_favorites: true,
        collection_id: DOWNLOAD_REASON_FAVORITES
      }
    }
  ])
}

export function* watchSaveTrack() {
  yield* takeEvery(tracksSocialActions.SAVE_TRACK, downloadSavedTrack)
}

export function* downloadSavedCollection(
  action: ReturnType<typeof collectionsSocialActions.saveCollection>
) {
  const offlineCollections = yield* select(getOfflineCollections)
  const currentUserId = yield* select(getUserId)

  if (
    !offlineCollections[DOWNLOAD_REASON_FAVORITES] ||
    action.source === FavoriteSource.OFFLINE_DOWNLOAD ||
    !currentUserId
  )
    return
  const collection: UserCollectionMetadata = (yield* call(
    [apiClient, apiClient.getPlaylist],
    {
      playlistId: action.collectionId,
      currentUserId
    }
  ))?.[0]

  const tracksForDownload = collection.tracks?.map((track) => ({
    trackId: track.track_id,
    downloadReason: {
      is_from_favorites: false,
      collection_id: action.collectionId.toString()
    }
  }))
  if (!tracksForDownload) return
  downloadCollectionById(action.collectionId, false)
  batchDownloadTrack(tracksForDownload)
}

export function* watchSaveCollection() {
  yield* takeEvery(
    collectionsSocialActions.SAVE_COLLECTION,
    downloadSavedCollection
  )
}

function* clearOffineDownloadsAsync() {
  yield* call(purgeAllDownloads)
}

function* watchClearOfflineDownloads() {
  yield* takeLatest(clearOfflineDownloads, clearOffineDownloadsAsync)
}

const sagas = () => {
  return [watchSaveTrack, watchSaveCollection, watchClearOfflineDownloads]
}

export default sagas
