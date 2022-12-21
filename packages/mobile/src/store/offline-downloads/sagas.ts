import type { UserCollectionMetadata } from '@audius/common'
import {
  tracksSocialActions,
  collectionsSocialActions,
  accountSelectors
} from '@audius/common'
import { call, select, takeEvery } from 'typed-redux-saga'

import { apiClient } from 'app/services/audius-api-client'
import {
  batchDownloadTrack,
  downloadCollectionById,
  DOWNLOAD_REASON_FAVORITES
} from 'app/services/offline-downloader'

import { getOfflineCollections } from './selectors'
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

  if (!offlineCollections[DOWNLOAD_REASON_FAVORITES] || !currentUserId) return
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

const sagas = () => {
  return [watchSaveTrack, watchSaveCollection]
}

export default sagas
