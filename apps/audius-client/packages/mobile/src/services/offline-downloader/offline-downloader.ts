import path from 'path'

import type {
  Collection,
  CommonState,
  Track,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common'
import {
  FavoriteSource,
  cacheCollectionsSelectors,
  Kind,
  makeUid,
  encodeHashId,
  accountSelectors,
  cacheUsersSelectors,
  collectionsSocialActions
} from '@audius/common'
import { uniq, isEqual } from 'lodash'
import RNFS, { exists } from 'react-native-fs'

import type { TrackForDownload } from 'app/components/offline-downloads'
import { getAccountCollections } from 'app/screens/favorites-screen/selectors'
import { store } from 'app/store'
import {
  addCollection,
  batchStartDownload,
  startDownload,
  completeDownload,
  errorDownload,
  loadTrack
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
const { getCollection } = cacheCollectionsSelectors
const { getUserFromCollection } = cacheUsersSelectors

export const DOWNLOAD_REASON_FAVORITES = 'favorites'

/** Main entrypoint - perform all steps required to complete a download for each track */
export const downloadCollectionById = (
  collectionId?: number | null,
  isFavoritesDownload?: boolean
) => {
  const state = store.getState()
  const collection = getCollection(state, { id: collectionId })
  return downloadCollection(collection, isFavoritesDownload)
}

export const downloadCollection = async (
  collection: Collection | null,
  isFavoritesDownload?: boolean
) => {
  const state = store.getState()
  const user = getUserFromCollection(state, { id: collection?.playlist_id })
  const collectionIdStr: string | undefined = isFavoritesDownload
    ? DOWNLOAD_REASON_FAVORITES
    : collection?.playlist_id.toString()
  if (!collectionIdStr) return
  store.dispatch(addCollection(collectionIdStr))
  if (isFavoritesDownload) {
    writeFavoritesCollectionJson()
    // @ts-ignore state is CommonState
    const userCollections = getAccountCollections(state as CommonState, '')
    userCollections.forEach(async (userCollection) => {
      const user = getUserFromCollection(state, {
        id: userCollection.playlist_id
      })
      if (!user) return
      userCollection = await populateCoverArtSizes({
        ...userCollection,
        user
      })
      downloadCollectionCoverArt(userCollection)
      writeCollectionJson(
        userCollection.playlist_id.toString(),
        userCollection,
        user
      )
    })
  } else {
    if (!collection || !user) return
    store.dispatch(
      saveCollection(collection.playlist_id, FavoriteSource.OFFLINE_DOWNLOAD)
    )
    collection = await populateCoverArtSizes({
      ...collection,
      user
    })
    downloadCollectionCoverArt(collection)
    await writeCollectionJson(collectionIdStr, collection!, user)
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

  // Throw this
  const failJob = (message?: string) => {
    store.dispatch(errorDownload(trackIdStr))
    return new Error(message)
  }

  // @ts-ignore mismatch in an irrelevant part of state
  const state = store.getState() as CommonState
  const currentUserId = getUserId(state)

  let track: (UserTrackMetadata & Track) | undefined = await apiClient.getTrack(
    {
      id: trackId,
      currentUserId
    }
  )

  if (!track) {
    throw failJob(`track to download not found on discovery - ${trackIdStr}`)
  }
  if (
    track?.is_delete ||
    (track?.is_unlisted && currentUserId !== track.user.user_id)
  ) {
    throw failJob(`track to download is not available - ${trackIdStr}`)
  }

  track = await populateCoverArtSizes(track)

  try {
    store.dispatch(startDownload(trackIdStr))
    if (await verifyTrack(trackIdStr, false)) {
      // Track is already downloaded, so rewrite the json
      // to include this collection in the reasons_for_download list
      const trackJson = await getTrackJson(trackIdStr)
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
      await writeTrackJson(trackIdStr, trackToWrite)
      const lineupTrack = {
        uid: makeUid(Kind.TRACKS, track.track_id),
        ...trackToWrite
      }
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
    await writeTrackJson(trackIdStr, trackToWrite)
    const verified = await verifyTrack(trackIdStr, true)
    if (verified) {
      const lineupTrack = {
        uid: makeUid(Kind.TRACKS, track.track_id),
        ...trackToWrite
      }
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

export const removeCollectionDownload = async (
  collectionId: string,
  tracksForDownload: TrackForDownload[]
) => {
  purgeDownloadedCollection(collectionId)
  batchRemoveTrackDownload(tracksForDownload)
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
  const creatorNodeEndpoints = user.creator_node_endpoint.split(',')
  const destination = getLocalAudioPath(track.track_id.toString())

  for (const creatorNodeEndpoint of creatorNodeEndpoints) {
    const uri = `${creatorNodeEndpoint}/tracks/stream/${encodedTrackId}`
    const statusCode = await downloadIfNotExists(uri, destination)
    if (statusCode) {
      return statusCode
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
