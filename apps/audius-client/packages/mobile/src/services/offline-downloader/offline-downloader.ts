import path from 'path'

import type {
  CollectionMetadata,
  CommonState,
  ID,
  Track,
  UserCollectionMetadata,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common'
import {
  cacheTracksSelectors,
  SquareSizes,
  encodeHashId,
  accountSelectors,
  reachabilitySelectors
} from '@audius/common'
import { uniq, isEqual } from 'lodash'
import RNFetchBlob from 'rn-fetch-blob'

import { createAllImageSources } from 'app/hooks/useContentNodeImage'
import { fetchAllFavoritedTracks } from 'app/hooks/useFetchAllFavoritedTracks'
import { getAccountCollections } from 'app/screens/favorites-screen/selectors'
import { store } from 'app/store'
import {
  getOfflineCollections,
  getOfflineFavoritedCollections,
  getOfflineTracks
} from 'app/store/offline-downloads/selectors'
import {
  actions as offlineDownloadsActions,
  batchInitDownload,
  startDownload,
  completeDownload,
  errorDownload,
  loadTrack,
  removeDownload,
  batchInitCollectionDownload,
  errorCollectionDownload,
  startCollectionDownload,
  completeCollectionDownload,
  OfflineDownloadStatus
} from 'app/store/offline-downloads/slice'

import { apiClient } from '../audius-api-client'

import {
  cancelQueuedCollectionDownloads,
  cancelQueuedDownloads,
  enqueueCollectionDownload,
  enqueueTrackDownload
} from './offline-download-queue'
import {
  getLocalAudioPath,
  getLocalTrackCoverArtDestination,
  purgeDownloadedTrack,
  getTrackJson,
  verifyTrack,
  writeTrackJson,
  writeCollectionJson,
  writeFavoritesCollectionJson,
  purgeDownloadedCollection,
  getLocalCollectionCoverArtDestination,
  mkdirSafe
} from './offline-storage'
import type { CollectionForDownload, TrackForDownload } from './types'

const {
  fs: { exists }
} = RNFetchBlob
const { getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors
const { getIsReachable } = reachabilitySelectors
export const DOWNLOAD_REASON_FAVORITES = 'favorites'

export const downloadAllFavorites = async () => {
  const state = store.getState()
  const currentUserId = getUserId(state)
  if (!currentUserId) return

  store.dispatch(
    startCollectionDownload({
      collectionId: DOWNLOAD_REASON_FAVORITES,
      isFavoritesDownload: false // 'favorites' is not a favorites download
    })
  )
  await writeFavoritesCollectionJson()

  const allFavoritedTracks = await fetchAllFavoritedTracks(currentUserId)
  const tracksForDownload: TrackForDownload[] = allFavoritedTracks.map(
    ({ trackId, favoriteCreatedAt }) => ({
      trackId,
      downloadReason: {
        is_from_favorites: true,
        collection_id: DOWNLOAD_REASON_FAVORITES,
        favorite_created_at: favoriteCreatedAt
      },
      favoriteCreatedAt
    })
  )

  batchDownloadTrack(tracksForDownload)

  // @ts-ignore state is CommonState
  const favoritedCollections = getAccountCollections(state as CommonState, '')
  batchDownloadCollection(favoritedCollections, true)
}

export const batchDownloadCollection = (
  collections: CollectionMetadata[],
  isFavoritesDownload: boolean,
  skipTracks = false
) => {
  const collectionsForDownload: CollectionForDownload[] = collections.map(
    (collection) => ({
      collectionId: collection.playlist_id,
      isFavoritesDownload
    })
  )
  store.dispatch(
    batchInitCollectionDownload({
      collectionIds: collectionsForDownload.map(
        ({ collectionId }) => collectionId
      ),
      isFavoritesDownload
    })
  )
  collectionsForDownload.forEach((collectionForDownload) =>
    enqueueCollectionDownload(collectionForDownload)
  )

  if (skipTracks) return
  const tracksForDownload = collections.flatMap((collection) =>
    collection.playlist_contents.track_ids.map(({ track: trackId }) => ({
      trackId,
      downloadReason: {
        is_from_favorites: isFavoritesDownload,
        collection_id: collection.playlist_id.toString()
      }
    }))
  )
  batchDownloadTrack(tracksForDownload)
}

export const downloadCollection = async ({
  collectionId,
  isFavoritesDownload
}: CollectionForDownload) => {
  const state = store.getState()
  const currentUserId = getUserId(state)
  store.dispatch(startCollectionDownload({ collectionId, isFavoritesDownload }))

  // Throw this
  const failJob = (message?: string) => {
    store.dispatch(
      errorCollectionDownload({ collectionId, isFavoritesDownload })
    )
    return new Error(message)
  }

  const collectionFromApi = (
    await apiClient.getPlaylist({
      playlistId: collectionId,
      currentUserId
    })
  )[0]

  if (!collectionFromApi) {
    throw failJob(
      `collection to download not found on discovery - ${collectionFromApi}`
    )
  }
  const collection = collectionFromApi

  // Prevent download of unavailable collections
  if (
    collection.is_delete ||
    // Not sure this is necessary
    (collection.is_private && collection.playlist_owner_id !== currentUserId)
  )
    throw failJob(`collection to download is not available - ${collectionId}`)

  await downloadCollectionCoverArt(collection)

  const collectionToWrite: CollectionMetadata = {
    ...collection,
    offline: {
      // TODO: This is broken! Need to add download reasons. We are only tracking the last known download reason.
      isFavoritesDownload: !!isFavoritesDownload
    }
  }

  await writeCollectionJson(
    collectionId.toString(),
    collectionToWrite,
    collection.user
  )

  store.dispatch(
    completeCollectionDownload({ collectionId, isFavoritesDownload })
  )
}

export const batchDownloadTrack = (tracksForDownload: TrackForDownload[]) => {
  store.dispatch(
    batchInitDownload(
      tracksForDownload.map(({ trackId }) => trackId.toString())
    )
  )
  tracksForDownload.forEach((trackForDownload) =>
    enqueueTrackDownload(trackForDownload)
  )
}

export const downloadTrack = async (trackForDownload: TrackForDownload) => {
  const { trackId, downloadReason, favoriteCreatedAt } = trackForDownload
  const trackIdStr = trackId.toString()
  store.dispatch(startDownload(trackIdStr))

  // Throw this
  const failJob = (message?: string) => {
    store.dispatch(errorDownload(trackIdStr))
    return new Error(message)
  }

  const state = store.getState()
  const currentUserId = getUserId(state)
  if (shouldAbortDownload(trackForDownload)) return

  const trackFromApi = await apiClient.getTrack({
    id: trackId,
    currentUserId
  })

  if (!trackFromApi) {
    throw failJob(`track to download not found on discovery - ${trackIdStr}`)
  }
  if (
    trackFromApi?.is_delete ||
    (trackFromApi?.is_unlisted && currentUserId !== trackFromApi.user.user_id)
  ) {
    throw failJob(`track to download is not available - ${trackIdStr}`)
  }

  try {
    if (await verifyTrack(trackIdStr, false)) {
      const trackJson = await getTrackJson(trackIdStr)
      if (!trackJson) return

      // Track is already downloaded, so rewrite the json
      // to include this collection in the reasons_for_download list

      // Skip if duplicate download reason
      if (
        trackJson.offline?.reasons_for_download.some(
          (existingReason) =>
            existingReason.collection_id === downloadReason.collection_id &&
            existingReason.is_from_favorites ===
              downloadReason.is_from_favorites
        )
      ) {
        store.dispatch(completeDownload(trackIdStr))
        return
      }
      const now = Date.now()
      const trackToWrite: Track & UserTrackMetadata = {
        ...trackJson,
        offline: {
          download_completed_time:
            trackJson.offline?.download_completed_time ?? now,
          last_verified_time: trackJson.offline?.last_verified_time ?? now,
          reasons_for_download: trackJson.offline?.reasons_for_download?.concat(
            downloadReason
          ) ?? [downloadReason],
          favorite_created_at: trackJson.offline?.favorite_created_at
        }
      }

      if (shouldAbortDownload(trackForDownload)) return

      await writeTrackJson(trackIdStr, trackToWrite)

      store.dispatch(loadTrack(trackToWrite))
      store.dispatch(completeDownload(trackIdStr))
      return
    }

    await downloadTrackCoverArt(trackFromApi)

    await tryDownloadTrackFromEachCreatorNode(trackFromApi)
    const now = Date.now()
    const trackToWrite: Track & UserTrackMetadata = {
      ...trackFromApi,
      // Empty cover art sizes because the images are stored locally
      _cover_art_sizes: {},
      offline: {
        reasons_for_download: uniq([
          downloadReason,
          ...(trackFromApi?.offline?.reasons_for_download ?? [])
        ]),
        download_completed_time: now,
        last_verified_time: now,
        favorite_created_at: favoriteCreatedAt
      }
    }

    await writeTrackJson(trackIdStr, trackToWrite)

    if (shouldAbortDownload(trackForDownload)) return

    const verified = await verifyTrack(trackIdStr, true)
    if (!verified) {
      throw failJob(
        `DownloadQueueWorker - download verification failed ${trackIdStr}`
      )
    }
    store.dispatch(loadTrack(trackToWrite))
    store.dispatch(completeDownload(trackIdStr))
    return
  } catch (e) {
    throw failJob(e.message)
  } finally {
    if (shouldAbortDownload(trackForDownload)) {
      removeTrackDownload(trackForDownload)
    }
  }
}

// Util to check if we should short-circuit download in case the associated collection download has been cancelled
const shouldAbortDownload = (trackForDownload: TrackForDownload) => {
  const { trackId, downloadReason } = trackForDownload
  const { collection_id, is_from_favorites } = downloadReason
  const state = store.getState()
  const offlineCollections = getOfflineCollections(state)
  const favoritedOfflineCollections = getOfflineFavoritedCollections(state)
  const cachedTrack = getTrack(state, { id: trackId })
  const isSaved = cachedTrack?.has_current_user_saved
  const isFavoritesMarkedForDownload =
    offlineCollections[DOWNLOAD_REASON_FAVORITES]

  // Abort all favorites downloads when favorites are not marked for download
  if (is_from_favorites && !isFavoritesMarkedForDownload) {
    return true
  }

  // Abort all track downloads for a unsuccessfully downloaded collection
  if (
    collection_id &&
    collection_id !== DOWNLOAD_REASON_FAVORITES &&
    offlineCollections[collection_id] !== OfflineDownloadStatus.SUCCESS &&
    favoritedOfflineCollections[collection_id] !== OfflineDownloadStatus.SUCCESS
  ) {
    return true
  }

  // Abort track that has been unfavorited in favorited tracks collection
  if (collection_id === DOWNLOAD_REASON_FAVORITES && isSaved === false) {
    return true
  }
}

export const removeAllDownloadedFavorites = async () => {
  const state = store.getState()
  const currentUserId = getUserId(state)
  const isReachable = getIsReachable(state)
  if (!currentUserId) return
  const downloadedCollections = getOfflineCollections(state)
  const favoritedDownloadedCollections = getOfflineFavoritedCollections(state)
  const offlineTracks = getOfflineTracks(state)

  const downloadedFavoritedTracks = Object.values(offlineTracks)
    .filter((track) => !!track.offline?.favorite_created_at)
    .map((track) => ({
      trackId: track.track_id,
      favoriteCreatedAt: track.offline?.favorite_created_at
    }))

  purgeDownloadedCollection(DOWNLOAD_REASON_FAVORITES)

  const allFavoritedTracks = isReachable
    ? [
        ...(await fetchAllFavoritedTracks(currentUserId)),
        ...downloadedFavoritedTracks
      ]
    : downloadedFavoritedTracks
  const tracksForDownload: TrackForDownload[] = allFavoritedTracks.map(
    ({ trackId, favoriteCreatedAt }) => ({
      trackId,
      downloadReason: {
        is_from_favorites: true,
        collection_id: DOWNLOAD_REASON_FAVORITES,
        favorite_created_at: favoriteCreatedAt
      }
    })
  )

  // remove collections if they're not also downloaded separately
  Object.entries(favoritedDownloadedCollections).forEach(
    ([collectionId, isDownloaded]) => {
      // Find any tracks from downloaded collections and mark them
      // to be removed.
      tracksForDownload.push(
        ...Object.values(offlineTracks)
          .filter((track) =>
            track.offline?.reasons_for_download.some(
              (reason) =>
                reason.collection_id === collectionId &&
                reason.is_from_favorites
            )
          )
          .map((track) => ({
            trackId: track.track_id,
            downloadReason: {
              is_from_favorites: true,
              collection_id: collectionId
            }
          }))
      )

      if (!isDownloaded) return
      if (downloadedCollections[collectionId]) {
        store.dispatch(
          offlineDownloadsActions.removeCollectionDownload({
            collectionId,
            isFavoritesDownload: true
          })
        )
      } else {
        purgeDownloadedCollection(collectionId)
      }
    }
  )

  batchRemoveTrackDownload(tracksForDownload)
}

export const removeDownloadedCollectionFromFavorites = async (
  collectionId: ID,
  tracksForDownload: TrackForDownload[]
) => {
  const state = store.getState()
  const downloadedCollections = getOfflineCollections(state)
  const favoritedDownloadedCollections = getOfflineFavoritedCollections(state)
  if (!favoritedDownloadedCollections[collectionId]) return
  if (downloadedCollections[collectionId]) {
    const collectionForDownload = {
      collectionId,
      isFavoritesDownload: true
    }
    store.dispatch(
      offlineDownloadsActions.removeCollectionDownload(collectionForDownload)
    )
    cancelQueuedCollectionDownloads([collectionForDownload])
  } else {
    removeCollectionDownload(collectionId, tracksForDownload)
  }
}

export const removeCollectionDownload = async (
  collectionId: number,
  tracksForDownload: TrackForDownload[]
) => {
  cancelQueuedCollectionDownloads([
    {
      collectionId,
      isFavoritesDownload: true
    },
    {
      collectionId,
      isFavoritesDownload: false
    }
  ])
  batchRemoveTrackDownload(tracksForDownload)
  purgeDownloadedCollection(collectionId.toString())
}

export const batchRemoveTrackDownload = async (
  tracksForDownload: TrackForDownload[]
) => {
  cancelQueuedDownloads(tracksForDownload)
  tracksForDownload.forEach(removeTrackDownload)
}

export const removeTrackDownload = async ({
  trackId,
  downloadReason
}: TrackForDownload) => {
  try {
    const trackIdStr = trackId.toString()
    const diskTrack = await getTrackJson(trackIdStr)
    const downloadReasons = diskTrack?.offline?.reasons_for_download ?? []
    const remainingReasons = downloadReasons.filter((reason) =>
      downloadReason.collection_id === DOWNLOAD_REASON_FAVORITES
        ? !reason.is_from_favorites
        : !isEqual(reason, downloadReason)
    )
    if (!diskTrack || remainingReasons.length === 0) {
      purgeDownloadedTrack(trackIdStr)
      store.dispatch(removeDownload(trackIdStr))
    } else {
      const now = Date.now()
      const trackToWrite = {
        ...diskTrack,
        offline: {
          download_completed_time:
            diskTrack.offline?.download_completed_time ?? now,
          last_verified_time: diskTrack.offline?.last_verified_time ?? now,
          reasons_for_download: remainingReasons,
          favorite_created_at: diskTrack.offline?.favorite_created_at
        }
      }
      store.dispatch(loadTrack(trackToWrite))
      await writeTrackJson(trackIdStr, trackToWrite)
    }
  } catch (e) {
    console.error(
      `failed to remove track ${trackId} from collection ${downloadReason.collection_id}`
    )
  }
}

const downloadCoverArt =
  <T extends UserTrackMetadata | UserCollectionMetadata>(
    getDestination: (entity: T, uri: string) => string
  ) =>
  async (entity: T) => {
    const cid = entity ? entity.cover_art_sizes || entity.cover_art : null

    const imageSources = createAllImageSources({
      cid,
      user: entity.user,
      // Only download the largest image
      size: SquareSizes.SIZE_1000_BY_1000
    })

    const coverArtUris = imageSources
      .map(({ uri }) => uri)
      .filter((uri): uri is string => !!uri)

    const downloadImage = async (uris: string[]) => {
      if (!uris.length) {
        return
      }
      const uri = uris[0]

      const destination = getDestination(entity, uri)

      const response = await downloadIfNotExists(uri, destination)
      if (response !== 200) {
        await downloadImage(uris.slice(1))
      }
    }

    await downloadImage(coverArtUris)
  }

const getTrackArtDestination = (entity: UserTrackMetadata, uri: string) =>
  getLocalTrackCoverArtDestination(entity.track_id.toString(), uri)

const getCollectionArtDestination = (
  entity: UserCollectionMetadata,
  uri: string
) => getLocalCollectionCoverArtDestination(entity.playlist_id.toString(), uri)

export const downloadTrackCoverArt = downloadCoverArt(getTrackArtDestination)
export const downloadCollectionCoverArt = downloadCoverArt(
  getCollectionArtDestination
)

export const tryDownloadTrackFromEachCreatorNode = async (
  track: UserTrackMetadata
) => {
  const state = store.getState()
  const user = (
    await apiClient.getUser({
      userId: track?.owner_id,
      // @ts-ignore mismatch in an irrelevant part of state
      currentUserId: getUserId(state)
    })
  )[0] as UserMetadata
  const encodedTrackId = encodeHashId(track.track_id)
  const creatorNodeEndpoints = user.creator_node_endpoint?.split(',')
  const destination = getLocalAudioPath(track.track_id.toString())

  if (creatorNodeEndpoints) {
    for (const creatorNodeEndpoint of creatorNodeEndpoints) {
      const uri = `${creatorNodeEndpoint}/tracks/stream/${encodedTrackId}`
      const statusCode = await downloadIfNotExists(uri, destination)
      if (statusCode) {
        return statusCode
      }
    }
  }
}

/** Dowanload file at uri to destination unless there is already a file at that location or overwrite is true */
const downloadIfNotExists = async (
  uri: string,
  destination: string,
  overwrite?: boolean
) => {
  if (!uri || !destination) return null
  if (!overwrite && (await exists(destination))) {
    return null
  }

  const destinationDirectory = path.dirname(destination)
  await mkdirSafe(destinationDirectory)

  const result = await RNFetchBlob.config({
    path: destination
  }).fetch('GET', uri)

  return result?.info().status ?? null
}
