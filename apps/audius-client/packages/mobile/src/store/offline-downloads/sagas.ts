import type {
  Collection,
  AccountCollection,
  UserCollectionMetadata
} from '@audius/common'
import {
  collectionPageActions,
  FavoriteSource,
  tracksSocialActions,
  cacheCollectionsActions,
  collectionsSocialActions,
  accountSelectors,
  cacheCollectionsSelectors,
  reachabilityActions
} from '@audius/common'
import { waitForBackendSetup } from 'audius-client/src/common/store/backend/sagas'
import { waitForRead } from 'audius-client/src/utils/sagaHelpers'
import {
  takeLatest,
  call,
  select,
  take,
  takeEvery,
  put
} from 'typed-redux-saga'

import { apiClient } from 'app/services/audius-api-client'
import {
  purgeAllDownloads,
  batchDownloadTrack,
  DOWNLOAD_REASON_FAVORITES,
  syncFavoritedTracks,
  syncFavoritedCollections,
  syncStaleTracks,
  syncCollectionsTracks,
  enqueueTrackDownload,
  batchDownloadCollection,
  batchRemoveTrackDownload
} from 'app/services/offline-downloader'
import {
  blockedPlayCounterWorker,
  playCounterWorker,
  setPlayCounterWorker
} from 'app/services/offline-downloader/workers'

import {
  getIsCollectionMarkedForDownload,
  getOfflineCollections,
  getOfflineFavoritedCollections
} from './selectors'
import {
  clearOfflineDownloads,
  doneLoadingFromDisk,
  OfflineDownloadStatus,
  startDownload
} from './slice'
const { fetchCollection, FETCH_COLLECTION_SUCCEEDED, FETCH_COLLECTION_FAILED } =
  collectionPageActions
const { SET_REACHABLE, SET_UNREACHABLE } = reachabilityActions
const { getUserId } = accountSelectors
const { getCollections } = cacheCollectionsSelectors

export function* downloadSavedTrack(
  action: ReturnType<typeof tracksSocialActions.saveTrack>
) {
  const offlineCollections = yield* select(getOfflineCollections)
  if (!offlineCollections[DOWNLOAD_REASON_FAVORITES]) return
  enqueueTrackDownload({
    trackId: action.trackId,
    downloadReason: {
      is_from_favorites: true,
      collection_id: DOWNLOAD_REASON_FAVORITES
    }
  })
}

export function* watchSaveTrack() {
  yield* takeEvery(tracksSocialActions.SAVE_TRACK, downloadSavedTrack)
}

type UnsaveTrackAction = ReturnType<typeof tracksSocialActions.unsaveTrack>

function* watchUnsaveTrack() {
  yield* takeEvery(
    tracksSocialActions.UNSAVE_TRACK,
    function* removeTrack(action: UnsaveTrackAction) {
      const { trackId } = action
      const trackToRemove = {
        trackId,
        downloadReason: {
          is_from_favorites: true,
          collection_id: DOWNLOAD_REASON_FAVORITES
        }
      }

      yield* call(batchRemoveTrackDownload, [trackToRemove])
    }
  )
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
  batchDownloadCollection([collection], true)
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

export function* startSync() {
  try {
    yield* take(doneLoadingFromDisk)
    yield* waitForRead()
    yield* waitForBackendSetup()
    const collections = yield* select(getCollections)
    // Don't use getAccountSelections as it filters out collections not in cache
    const accountCollections: { [id: number]: AccountCollection } =
      yield* select((state) => state.account.collections)
    const accountCollectionIds = Object.values(accountCollections).map(
      (collection) => collection.id
    )
    const offlineCollectionsState = yield* select(getOfflineCollections)
    const isFavoritesDownloadEnabled =
      offlineCollectionsState[DOWNLOAD_REASON_FAVORITES]
    const offlineFavoritedCollections = yield* select(
      getOfflineFavoritedCollections
    )
    const existingOfflineCollections: Collection[] = Object.entries(
      offlineFavoritedCollections
    )
      .filter(
        ([id, isDownloaded]) => isDownloaded && id !== DOWNLOAD_REASON_FAVORITES
      )
      .map(([id, isDownloaded]) => collections[id] ?? null)
      .filter((collection) => !!collection)

    if (isFavoritesDownloadEnabled) {
      // Individual tracks
      yield* call(syncFavoritedTracks)

      // Favorited collections
      for (const collectionId of accountCollectionIds) {
        yield* put(fetchCollection(collectionId))
        yield* take([FETCH_COLLECTION_SUCCEEDED, FETCH_COLLECTION_FAILED])
      }

      const updatedCollections = yield* select(getCollections)
      const updatedAccountCollections = accountCollectionIds
        .map((id) => updatedCollections[id])
        .filter((collection) => !!collection)

      yield* call(
        syncFavoritedCollections,
        existingOfflineCollections,
        updatedAccountCollections
      )
    }

    // Individual collections
    yield* call(
      syncCollectionsTracks,
      existingOfflineCollections,
      isFavoritesDownloadEnabled !== OfflineDownloadStatus.INACTIVE &&
        isFavoritesDownloadEnabled !== OfflineDownloadStatus.ERROR
    )
    yield* call(syncStaleTracks)
  } catch (e) {
    console.error('SyncSaga - error', e.message, e.stack)
  }
}

export function* handleSetReachable() {
  yield* call(setPlayCounterWorker, playCounterWorker)
}

export function* watchSetReachable() {
  yield* takeLatest(SET_REACHABLE, handleSetReachable)
}

export function* handleSetUnreachable() {
  yield* call(setPlayCounterWorker, blockedPlayCounterWorker)
}

export function* watchSetUnreachable() {
  yield* takeLatest(SET_UNREACHABLE, handleSetUnreachable)
}

function* downloadNewPlaylistTrackIfNecessary({
  trackId,
  playlistId
}: ReturnType<typeof cacheCollectionsActions.addTrackToPlaylist>) {
  const isCollectionDownloaded = yield* select(
    getIsCollectionMarkedForDownload(playlistId.toString())
  )
  if (!isCollectionDownloaded || !trackId) return

  const favoriteDownloadedCollections = yield* select(
    getOfflineFavoritedCollections
  )
  const trackForDownload = {
    trackId,
    downloadReason: {
      collection_id: playlistId.toString(),
      is_from_favorites: !!favoriteDownloadedCollections[playlistId]
    }
  }
  yield* put(startDownload(trackId.toString()))
  yield* call(enqueueTrackDownload, trackForDownload)
}

function* watchAddTrackToPlaylist() {
  yield takeEvery(
    cacheCollectionsActions.ADD_TRACK_TO_PLAYLIST,
    downloadNewPlaylistTrackIfNecessary
  )
}

const sagas = () => {
  return [
    watchSaveTrack,
    watchUnsaveTrack,
    watchSaveCollection,
    watchClearOfflineDownloads,
    watchSetReachable,
    watchSetUnreachable,
    startSync,
    watchAddTrackToPlaylist
  ]
}

export default sagas
