import path from 'path'

import type {
  CollectionMetadata,
  CommonState,
  DownloadReason,
  Track,
  UserCollectionMetadata,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common'
import {
  SquareSizes,
  Variant,
  FavoriteSource,
  encodeHashId,
  accountSelectors,
  cacheUsersSelectors,
  collectionsSocialActions,
  reachabilitySelectors
} from '@audius/common'
import { uniq, isEqual } from 'lodash'
import RNFetchBlob from 'rn-fetch-blob'

import type { TrackForDownload } from 'app/components/offline-downloads'
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
  addCollection,
  batchStartDownload,
  startDownload,
  completeDownload,
  errorDownload,
  loadTrack,
  removeDownload,
  removeCollection
} from 'app/store/offline-downloads/slice'

import { apiClient } from '../audius-api-client'

import {
  cancelQueuedDownloads,
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

const {
  fs: { exists }
} = RNFetchBlob
const { saveCollection } = collectionsSocialActions
const { getUserId } = accountSelectors
const { getUserFromCollection } = cacheUsersSelectors
const { getIsReachable } = reachabilitySelectors
export const DOWNLOAD_REASON_FAVORITES = 'favorites'

export const downloadAllFavorites = async () => {
  const state = store.getState()
  const currentUserId = getUserId(state)
  if (!currentUserId) return

  store.dispatch(
    addCollection({
      collectionId: DOWNLOAD_REASON_FAVORITES,
      isFavoritesDownload: false
    })
  )
  writeFavoritesCollectionJson()

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
  favoritedCollections.forEach(async (userCollection) => {
    downloadCollection(userCollection, /* isFavoritesDownload */ true)
  })
}

export const downloadCollection = async (
  collection: CollectionMetadata,
  isFavoritesDownload?: boolean,
  skipTracks?: boolean
) => {
  const state = store.getState()
  const currentUserId = getUserId(state)

  // Prevent download of unavailable collections
  if (
    !collection ||
    // @ts-ignore shouldn't be necessary, but not sure we trust the types all the way down
    collection.variant === Variant.SMART ||
    collection.is_delete ||
    (collection.is_private && collection.playlist_owner_id !== currentUserId)
  )
    return

  const user = getUserFromCollection(state, { id: collection?.playlist_id })
  const collectionIdStr: string = collection.playlist_id.toString()
  store.dispatch(
    addCollection({
      collectionId: collectionIdStr,
      isFavoritesDownload: !!isFavoritesDownload
    })
  )

  if (!user) return

  const isOwner = currentUserId === user.user_id
  if (!collection.has_current_user_saved && !isOwner) {
    store.dispatch(
      saveCollection(collection.playlist_id, FavoriteSource.OFFLINE_DOWNLOAD)
    )
  }

  const collectionWithUser: UserCollectionMetadata = {
    ...collection,
    user
  }

  downloadCollectionCoverArt(collectionWithUser)

  const collectionToWrite: CollectionMetadata = {
    ...collectionWithUser,
    offline: {
      isFavoritesDownload: !!isFavoritesDownload
    }
  }
  await writeCollectionJson(collectionIdStr, collectionToWrite, user)
  const tracksForDownload = collection.playlist_contents.track_ids.map(
    ({ track: trackId }) => ({
      trackId,
      downloadReason: {
        is_from_favorites: isFavoritesDownload,
        collection_id: collection.playlist_id.toString()
      }
    })
  )

  if (!skipTracks) {
    batchDownloadTrack(tracksForDownload)
  }
}

export const batchDownloadTrack = (tracksForDownload: TrackForDownload[]) => {
  store.dispatch(
    batchStartDownload(
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
  const offlineTracks = getOfflineTracks(state)
  if (shouldAbortDownload(downloadReason)) {
    if (!offlineTracks[trackId]) {
      store.dispatch(removeDownload(trackIdStr))
    }
    return
  }

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
      // Track is already downloaded, so rewrite the json
      // to include this collection in the reasons_for_download list
      const trackJson = await getTrackJson(trackIdStr)

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

      if (shouldAbortDownload(downloadReason)) {
        // Don't dispatch removeDownload in this case, since it's already downloaded as part of another collection
        return
      }

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

    if (shouldAbortDownload(downloadReason)) {
      store.dispatch(removeDownload(trackIdStr))
      return
    }

    await writeTrackJson(trackIdStr, trackToWrite)
    const verified = await verifyTrack(trackIdStr, true)
    if (verified) {
      store.dispatch(loadTrack(trackToWrite))
      store.dispatch(completeDownload(trackIdStr))
      return
    } else {
      throw failJob(
        `DownloadQueueWorker - download verification failed ${trackIdStr}`
      )
    }
  } catch (e) {
    throw failJob(e.message)
  } finally {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
    if (shouldAbortDownload(downloadReason)) {
      removeTrackDownload(trackForDownload)
    }
  }
}

// Util to check if we should short-circuit download in case the associated collection download has been cancelled
const shouldAbortDownload = ({
  collection_id,
  is_from_favorites
}: DownloadReason) => {
  const state = store.getState()
  const offlineCollections = getOfflineCollections(state)
  const favoritedOfflineCollections = getOfflineFavoritedCollections(state)
  if (is_from_favorites && collection_id !== DOWNLOAD_REASON_FAVORITES) {
    return (
      !offlineCollections[DOWNLOAD_REASON_FAVORITES] ||
      (collection_id && !favoritedOfflineCollections[collection_id])
    )
  } else {
    return collection_id && !offlineCollections[collection_id]
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
          removeCollection({ collectionId, isFavoritesDownload: true })
        )
      } else {
        purgeDownloadedCollection(collectionId)
      }
    }
  )

  batchRemoveTrackDownload(tracksForDownload)
}

export const removeDownloadedCollectionFromFavorites = async (
  collectionId: string,
  tracksForDownload: TrackForDownload[]
) => {
  const state = store.getState()
  const downloadedCollections = getOfflineCollections(state)
  const favoritedDownloadedCollections = getOfflineFavoritedCollections(state)
  if (!favoritedDownloadedCollections[collectionId]) return
  if (downloadedCollections[collectionId]) {
    store.dispatch(
      removeCollection({ collectionId, isFavoritesDownload: true })
    )
  } else {
    purgeDownloadedCollection(collectionId)
    batchRemoveTrackDownload(tracksForDownload)
  }
}

export const removeCollectionDownload = async (
  collectionId: string,
  tracksForDownload: TrackForDownload[]
) => {
  batchRemoveTrackDownload(tracksForDownload)
  purgeDownloadedCollection(collectionId)
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
    const downloadReasons = diskTrack.offline?.reasons_for_download ?? []
    const remainingReasons = downloadReasons.filter((reason) =>
      downloadReason.collection_id === DOWNLOAD_REASON_FAVORITES
        ? !reason.is_from_favorites
        : !isEqual(reason, downloadReason)
    )
    if (remainingReasons.length === 0) {
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
