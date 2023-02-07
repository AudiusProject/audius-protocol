import type { ID } from '@audius/common'
import { accountSelectors, getContext } from '@audius/common'
import { select, call, put } from 'typed-redux-saga'

import {
  downloadCollectionCoverArt,
  DownloadCollectionError,
  writeCollectionJson,
  writeFavoritesCollectionJson
} from 'app/services/offline-downloader'

import type { CollectionId } from '../../slice'
import {
  completeDownload,
  downloadQueuedItem,
  errorDownload,
  startDownload
} from '../../slice'

const { getUserId } = accountSelectors

// TODO add favorites collection task
export function* downloadCollectionWorker(collectionId: CollectionId) {
  yield* put(startDownload({ type: 'collection', id: collectionId }))

  // "favorites" collection short circuit
  if (typeof collectionId === 'string') {
    yield* call(writeFavoritesCollectionJson)
    yield* put(completeDownload({ type: 'collection', id: collectionId }))
    yield* put(downloadQueuedItem())
    return
  }

  const currentUserId = yield* select(getUserId)
  const apiClient = yield* getContext('apiClient')
  const [collection] = yield* call([apiClient, apiClient.getPlaylist], {
    playlistId: collectionId,
    currentUserId
  })

  if (!collection) {
    yield* call(collectionDownloadFailed, {
      id: collectionId,
      message: `collection to download not found on discovery - ${collectionId}`,
      error: DownloadCollectionError.FAILED_TO_FETCH
    })
    return
  }
  if (collection.is_delete) {
    yield* call(collectionDownloadFailed, {
      id: collectionId,
      message: `collection to download is deleted - ${collectionId}`,
      error: DownloadCollectionError.IS_DELETED
    })
    return
  }
  if (collection.is_private && collection.playlist_owner_id !== currentUserId) {
    yield* call(collectionDownloadFailed, {
      id: collectionId,
      message: `collection to download is private and user is not owner - ${collectionId} - ${currentUserId}`,
      error: DownloadCollectionError.IS_PRIVATE
    })
    return
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
    yield* call(collectionDownloadFailed, {
      id: collectionId,
      message: e?.message ?? 'Unknown Error',
      error: DownloadCollectionError.UNKNOWN
    })
    return
  }

  yield* put(completeDownload({ type: 'collection', id: collectionId }))
  yield* put(downloadQueuedItem())
}

type CollectionDownloadFailedConfig = {
  id: ID
  message: string
  error: DownloadCollectionError
}

function* collectionDownloadFailed(config: CollectionDownloadFailedConfig) {
  const { id, message, error } = config
  yield* put(errorDownload({ type: 'collection', id }))

  if (
    error === DownloadCollectionError.IS_DELETED ||
    error === DownloadCollectionError.IS_PRIVATE
  ) {
    // todo remove and dont retry
  }

  // todo post error message?
  console.error(message)
  yield* put(downloadQueuedItem())
}
