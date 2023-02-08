import {
  accountSelectors,
  getContext,
  reachabilityActions
} from '@audius/common'
import { select, call, put, take, race } from 'typed-redux-saga'

import {
  downloadCollectionCoverArt,
  DOWNLOAD_REASON_FAVORITES,
  purgeDownloadedCollection,
  writeCollectionJson,
  writeFavoritesCollectionJson
} from 'app/services/offline-downloader'

import { getCollectionOfflineDownloadStatus } from '../../selectors'
import type { CollectionId } from '../../slice'
import {
  errorDownload,
  OfflineDownloadStatus,
  cancelDownload,
  removeOfflineItems,
  completeDownload,
  requestDownloadQueuedItem,
  startDownload
} from '../../slice'
const { SET_UNREACHABLE } = reachabilityActions

const { getUserId } = accountSelectors

function* shouldCancelDownload(collectionId: CollectionId) {
  while (true) {
    yield* take(removeOfflineItems.type)
    const trackStatus = yield* select(
      getCollectionOfflineDownloadStatus(collectionId)
    )
    if (!trackStatus) return true
  }
}

export function* downloadCollectionWorker(collectionId: CollectionId) {
  yield* put(startDownload({ type: 'collection', id: collectionId }))

  const { downloadCollection, unreachable, cancel } = yield* race({
    downloadCollection: call(downloadCollectionAsync, collectionId),
    cancel: call(shouldCancelDownload, collectionId),
    unreachable: take(SET_UNREACHABLE)
  })

  if (cancel) {
    yield* call(purgeDownloadedCollection, collectionId.toString())
    yield* put(requestDownloadQueuedItem())
  } else if (unreachable) {
    yield* put(cancelDownload({ type: 'collection', id: collectionId }))
    yield* call(purgeDownloadedCollection, collectionId.toString())
  } else if (downloadCollection === OfflineDownloadStatus.ERROR) {
    yield* put(errorDownload({ type: 'collection', id: collectionId }))
    yield* call(purgeDownloadedCollection, collectionId.toString())
    yield* put(requestDownloadQueuedItem())
  } else if (downloadCollection === OfflineDownloadStatus.SUCCESS) {
    yield* put(completeDownload({ type: 'collection', id: collectionId }))
    yield* put(requestDownloadQueuedItem())
  }
}

function* downloadCollectionAsync(collectionId: CollectionId) {
  if (collectionId === DOWNLOAD_REASON_FAVORITES) {
    yield* call(writeFavoritesCollectionJson)
    return OfflineDownloadStatus.SUCCESS
  }

  const currentUserId = yield* select(getUserId)
  const apiClient = yield* getContext('apiClient')
  const [collection] = yield* call([apiClient, apiClient.getPlaylist], {
    playlistId: collectionId,
    currentUserId
  })

  if (
    !collection ||
    collection.is_delete ||
    (collection.is_private && collection.playlist_owner_id !== currentUserId)
  ) {
    return OfflineDownloadStatus.ERROR
  }

  try {
    yield* call(downloadCollectionCoverArt, collection)
    yield* call(
      writeCollectionJson,
      collectionId.toString(),
      collection,
      collection.user
    )
  } catch (e) {
    return OfflineDownloadStatus.ERROR
  }

  return OfflineDownloadStatus.SUCCESS
}
