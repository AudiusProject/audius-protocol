import type { UserCollectionMetadata } from '@audius/common'
import {
  removeNullable,
  SquareSizes,
  accountSelectors,
  getContext,
  reachabilityActions
} from '@audius/common'
import RNFetchBlob from 'rn-fetch-blob'
import { select, call, put, take, race, all } from 'typed-redux-saga'

import { createAllImageSources } from 'app/hooks/useContentNodeImage'
import { make, track } from 'app/services/analytics'
import {
  getCollectionCoverArtPath,
  getLocalCollectionDir,
  getLocalCollectionJsonPath,
  mkdirSafe
} from 'app/services/offline-downloader'
import { DOWNLOAD_REASON_FAVORITES } from 'app/store/offline-downloads/constants'
import { EventNames } from 'app/types/analytics'

import { getCollectionOfflineDownloadStatus } from '../../../selectors'
import type { CollectionId, DownloadQueueItem } from '../../../slice'
import {
  abandonDownload,
  errorDownload,
  OfflineDownloadStatus,
  cancelDownload,
  removeOfflineItems,
  completeDownload,
  requestDownloadQueuedItem,
  startDownload
} from '../../../slice'
import { isCollectionDownloadable } from '../../utils/isCollectionDownloadable'

import { downloadFile } from './downloadFile'
const { SET_UNREACHABLE } = reachabilityActions

const { getUserId } = accountSelectors

function* shouldAbortDownload(collectionId: CollectionId) {
  while (true) {
    yield* take(removeOfflineItems.type)
    const trackStatus = yield* select(
      getCollectionOfflineDownloadStatus(collectionId)
    )
    if (!trackStatus) return true
  }
}

export function* downloadCollectionWorker(collectionId: CollectionId) {
  const queueItem = {
    type: 'collection',
    id: collectionId
  } as DownloadQueueItem
  track(
    make({ eventName: EventNames.OFFLINE_MODE_DOWNLOAD_START, ...queueItem })
  )
  yield* put(startDownload(queueItem))

  const { jobResult, cancel, abort } = yield* race({
    jobResult: call(downloadCollectionAsync, collectionId),
    abort: call(shouldAbortDownload, collectionId),
    cancel: take(SET_UNREACHABLE)
  })

  if (abort) {
    yield* call(removeDownloadedCollection, collectionId)
    yield* put(requestDownloadQueuedItem())
  } else if (cancel) {
    yield* put(cancelDownload({ type: 'collection', id: collectionId }))
    yield* call(removeDownloadedCollection, collectionId)
  } else if (jobResult === OfflineDownloadStatus.ERROR) {
    track(
      make({
        eventName: EventNames.OFFLINE_MODE_DOWNLOAD_FAILURE,
        ...queueItem
      })
    )
    yield* put(errorDownload({ type: 'collection', id: collectionId }))
    yield* call(removeDownloadedCollection, collectionId)
    yield* put(requestDownloadQueuedItem())
  } else if (jobResult === OfflineDownloadStatus.ABANDONED) {
    track(
      make({
        eventName: EventNames.OFFLINE_MODE_DOWNLOAD_FAILURE,
        ...queueItem
      })
    )
    yield* put(abandonDownload({ type: 'collection', id: collectionId }))
    yield* call(removeDownloadedCollection, collectionId)
    yield* put(requestDownloadQueuedItem())
  } else if (jobResult === OfflineDownloadStatus.SUCCESS) {
    track(
      make({
        eventName: EventNames.OFFLINE_MODE_DOWNLOAD_SUCCESS,
        ...queueItem
      })
    )
    yield* put(completeDownload({ type: 'collection', id: collectionId }))
    yield* put(requestDownloadQueuedItem())
  }
}

function* downloadCollectionAsync(
  collectionId: CollectionId
): Generator<any, OfflineDownloadStatus> {
  if (collectionId === DOWNLOAD_REASON_FAVORITES) {
    yield* call(writeFavoritesCollectionMetadata)
    return OfflineDownloadStatus.SUCCESS
  }

  const currentUserId = yield* select(getUserId)
  if (!currentUserId) return OfflineDownloadStatus.ERROR

  const apiClient = yield* getContext('apiClient')
  const [collection] = yield* call([apiClient, apiClient.getPlaylist], {
    playlistId: collectionId,
    currentUserId,
    // Needed to ensure APIClient doesn't abort when we become unreachable,
    // allowing this job time to self-cancel
    abortOnUnreachable: false
  })

  if (!collection) return OfflineDownloadStatus.ERROR

  if (!isCollectionDownloadable(collection, currentUserId)) {
    return OfflineDownloadStatus.ABANDONED
  }

  try {
    yield* all([
      call(downloadCollectionCoverArt, collection),
      call(writeCollectionMetadata, collection)
    ])
  } catch (e) {
    return OfflineDownloadStatus.ERROR
  }

  return OfflineDownloadStatus.SUCCESS
}

function* downloadCollectionCoverArt(collection: UserCollectionMetadata) {
  const { cover_art_sizes, cover_art, user, playlist_id } = collection
  const cid = cover_art_sizes ?? cover_art
  const imageSources = createAllImageSources({
    cid,
    user,
    size: SquareSizes.SIZE_1000_BY_1000
  })

  const coverArtUris = imageSources.map(({ uri }) => uri).filter(removeNullable)
  const covertArtFilePath = getCollectionCoverArtPath(playlist_id)

  for (const coverArtUri of coverArtUris) {
    const response = yield* call(downloadFile, coverArtUri, covertArtFilePath)
    const { status } = response.info()
    if (status === 200) return
  }
}

// Special case for favorites which is not a real collection with metadata
async function writeFavoritesCollectionMetadata() {
  const favoritesCollectionDirectory = getLocalCollectionDir(
    DOWNLOAD_REASON_FAVORITES
  )
  return await mkdirSafe(favoritesCollectionDirectory)
}

async function writeCollectionMetadata(collection: UserCollectionMetadata) {
  const { playlist_id } = collection
  const collectionMetadataPath = getLocalCollectionJsonPath(
    playlist_id.toString()
  )
  return await RNFetchBlob.fs.writeFile(
    collectionMetadataPath,
    JSON.stringify(collection)
  )
}

async function removeDownloadedCollection(collectionId: CollectionId) {
  const collectionDir = getLocalCollectionDir(collectionId.toString())
  return await RNFetchBlob.fs.unlink(collectionDir)
}
