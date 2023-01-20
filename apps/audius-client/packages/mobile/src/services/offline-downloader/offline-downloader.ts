import path from 'path'

import type {
  Collection,
  CollectionMetadata,
  CommonState,
  DownloadReason,
  Track,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common'
import {
  Variant,
  FavoriteSource,
  Kind,
  makeUid,
  encodeHashId,
  accountSelectors,
  cacheUsersSelectors,
  cacheActions,
  collectionsSocialActions
} from '@audius/common'
import { uniq, isEqual } from 'lodash'
import RNFS, { exists } from 'react-native-fs'

import type { TrackForDownload } from 'app/components/offline-downloads'
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
import { populateCoverArtSizes } from 'app/utils/populateCoverArtSizes'

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
  getLocalCollectionCoverArtDestination
} from './offline-storage'

const { saveCollection } = collectionsSocialActions
const { getUserId } = accountSelectors
const { getUserFromCollection } = cacheUsersSelectors
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
      }
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
  isFavoritesDownload?: boolean
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
  store.dispatch(
    saveCollection(collection.playlist_id, FavoriteSource.OFFLINE_DOWNLOAD)
  )
  const populatedCollection: Collection = await populateCoverArtSizes({
    ...collection,
    user
  })
  downloadCollectionCoverArt(populatedCollection)
  const collectionToWrite: CollectionMetadata = {
    ...populatedCollection,
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
  batchDownloadTrack(tracksForDownload)
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

  const track = await populateCoverArtSizes(trackFromApi)

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
      const trackToWrite: Track & UserTrackMetadata = {
        ...trackJson,
        offline: {
          download_completed_time:
            trackJson.offline?.download_completed_time ?? Date.now(),
          last_verified_time:
            trackJson.offline?.last_verified_time ?? Date.now(),
          reasons_for_download: trackJson.offline?.reasons_for_download?.concat(
            downloadReason
          ) ?? [downloadReason],
          favorite_created_at: trackJson.offline?.favorite_created_at
        }
      }

      if (shouldAbortDownload(downloadReason)) {
        // Don't dispatch removeDownlaod in this case, since it's already downloaded as part of another collection
        return
      }

      await writeTrackJson(trackIdStr, trackToWrite)
      const lineupTrack = {
        uid: makeUid(Kind.TRACKS, track.track_id),
        ...trackToWrite
      }
      const cacheTrack = {
        id: track.track_id,
        uid: lineupTrack.uid,
        metadata: lineupTrack
      }
      store.dispatch(cacheActions.add(Kind.TRACKS, [cacheTrack], false, true))

      store.dispatch(loadTrack(lineupTrack))
      store.dispatch(completeDownload(trackIdStr))
      return
    }

    await downloadTrackCoverArt(track)
    await tryDownloadTrackFromEachCreatorNode(track)
    const trackToWrite: Track & UserTrackMetadata = {
      ...track,
      offline: {
        reasons_for_download: uniq([
          downloadReason,
          ...(track?.offline?.reasons_for_download ?? [])
        ]),
        download_completed_time: Date.now(),
        last_verified_time: Date.now(),
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
      const lineupTrack = {
        uid: makeUid(Kind.TRACKS, track.track_id),
        ...trackToWrite
      }
      const cacheTrack = {
        id: track.track_id,
        uid: lineupTrack.uid,
        metadata: lineupTrack
      }
      store.dispatch(cacheActions.add(Kind.TRACKS, [cacheTrack], false, true))
      store.dispatch(loadTrack(lineupTrack))
      store.dispatch(completeDownload(trackIdStr))
      return
    } else {
      throw failJob(
        `DownloadQueueWorker - download verification failed ${trackIdStr}`
      )
    }
  } catch (e) {
    throw failJob(e.message)
  }
}

// Util to check if we should short-circuit download in case the associated collection download has been cancelled
const shouldAbortDownload = (downloadReason: DownloadReason) => {
  const state = store.getState()
  const offlineCollections = getOfflineCollections(state)
  return (
    (downloadReason.is_from_favorites &&
      !offlineCollections[DOWNLOAD_REASON_FAVORITES]) ||
    (!downloadReason.is_from_favorites &&
      downloadReason.collection_id &&
      !offlineCollections[downloadReason.collection_id])
  )
}

export const removeAllDownloadedFavorites = async () => {
  const state = store.getState()
  const currentUserId = getUserId(state)
  if (!currentUserId) return
  const downloadedCollections = getOfflineCollections(state)
  const favoritedDownloadedCollections = getOfflineFavoritedCollections(state)

  const allFavoritedTracks = await fetchAllFavoritedTracks(currentUserId)
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

  purgeDownloadedCollection(DOWNLOAD_REASON_FAVORITES)
  batchRemoveTrackDownload(tracksForDownload)

  // remove collections if they're not also downloaded separately
  Object.entries(favoritedDownloadedCollections).forEach(
    ([collectionId, isDownloaded]) => {
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
  tracksForDownload.forEach(async ({ trackId, downloadReason }) => {
    try {
      const trackIdStr = trackId.toString()
      const diskTrack = await getTrackJson(trackIdStr)
      const downloadReasons = diskTrack.offline?.reasons_for_download ?? []
      const remainingReasons = downloadReasons.filter(
        (reason) => !isEqual(reason, downloadReason)
      )
      if (remainingReasons.length === 0) {
        purgeDownloadedTrack(trackIdStr)
      } else {
        const trackToWrite = {
          ...diskTrack,
          offline: {
            download_completed_time:
              diskTrack.offline?.download_completed_time ?? Date.now(),
            last_verified_time:
              diskTrack.offline?.last_verified_time ?? Date.now(),
            reasons_for_download: remainingReasons,
            favorite_created_at: diskTrack.offline?.favorite_created_at
          }
        }
        await writeTrackJson(trackIdStr, trackToWrite)
      }
    } catch (e) {
      console.debug(
        `failed to remove track ${trackId} from collection ${downloadReason.collection_id}`
      )
    }
  })
}

export const downloadTrackCoverArt = async (track: Track) => {
  const coverArtUris = Object.values(track._cover_art_sizes)
  await Promise.all(
    coverArtUris.map(async (coverArtUri) => {
      const destination = getLocalTrackCoverArtDestination(
        track.track_id.toString(),
        coverArtUri
      )
      await downloadIfNotExists(coverArtUri, destination)
    })
  )
}

export const downloadCollectionCoverArt = async (collection: Collection) => {
  const coverArtUris = Object.values(collection._cover_art_sizes)
  await Promise.all(
    coverArtUris.map(async (coverArtUri) => {
      const destination = getLocalCollectionCoverArtDestination(
        collection.playlist_id.toString(),
        coverArtUri
      )
      await downloadIfNotExists(coverArtUri, destination)
    })
  )
}

export const tryDownloadTrackFromEachCreatorNode = async (track: Track) => {
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
  await RNFS.mkdir(destinationDirectory)

  const result = await RNFS.downloadFile({
    fromUrl: uri,
    toFile: destination
  })?.promise

  return result?.statusCode ?? null
}
