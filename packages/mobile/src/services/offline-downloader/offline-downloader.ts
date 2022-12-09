import path from 'path'

import type { Track, UserMetadata, UserTrackMetadata } from '@audius/common'
import {
  DefaultSizes,
  SquareSizes,
  encodeHashId,
  accountSelectors
} from '@audius/common'
import { uniq } from 'lodash'
import RNFS, { exists } from 'react-native-fs'

import { store } from 'app/store'
import {
  addCollection,
  batchStartDownload,
  startDownload,
  completeDownload,
  errorDownload,
  loadTrack,
  removeCollection
} from 'app/store/offline-downloads/slice'

import { apiClient } from '../audius-api-client'
import { audiusBackendInstance } from '../audius-backend-instance'

import type { TrackDownloadWorkerPayload } from './offline-download-queue'
import { enqueueTrackDownload } from './offline-download-queue'
import {
  getLocalAudioPath,
  getLocalCoverArtDestination,
  getLocalTrackJsonPath,
  purgeDownloadedTrack,
  getTrackJson,
  persistCollectionDownloadStatus,
  verifyTrack,
  writeTrackJson
} from './offline-storage'
const { getUserId } = accountSelectors

export const DOWNLOAD_REASON_FAVORITES = 'favorites'

/** Main entrypoint - perform all steps required to complete a download for each track */
export const downloadCollection = async (
  collection: string,
  trackIds: number[]
) => {
  store.dispatch(addCollection(collection))
  persistCollectionDownloadStatus(collection, true)
  store.dispatch(batchStartDownload(trackIds.map((id) => id.toString())))
  trackIds.forEach((trackId) => enqueueTrackDownload(trackId, collection))
}

const populateCoverArtSizes = async (track: UserTrackMetadata & Track) => {
  if (!track || !track.user || (!track.cover_art_sizes && !track.cover_art))
    return
  const gateways = audiusBackendInstance.getCreatorNodeIPFSGateways(
    track.user.creator_node_endpoint
  )
  const multihash = track.cover_art_sizes || track.cover_art
  if (!multihash) return track
  await Promise.allSettled(
    Object.values(SquareSizes).map(async (size) => {
      const coverArtSize = multihash === track.cover_art_sizes ? size : null
      const url = await audiusBackendInstance.getImageUrl(
        multihash,
        coverArtSize,
        gateways
      )
      track._cover_art_sizes = {
        ...track._cover_art_sizes,
        [coverArtSize || DefaultSizes.OVERRIDE]: url
      }
    })
  )
  return track
}

export const downloadTrack = async ({
  trackId,
  collection
}: TrackDownloadWorkerPayload) => {
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

  track = (await populateCoverArtSizes(track)) ?? track

  try {
    store.dispatch(startDownload(trackIdStr))
    if (await verifyTrack(trackIdStr, false)) {
      // Track is already downloaded, so rewrite the json
      // to include this collection in the downloaded_from_collection list
      const trackJson = await getTrackJson(trackIdStr)
      const trackToWrite: UserTrackMetadata = {
        ...trackJson,
        offline: {
          download_completed_time:
            trackJson.offline?.download_completed_time ?? Date.now(),
          last_verified_time:
            trackJson.offline?.last_verified_time ?? Date.now(),
          downloaded_from_collection:
            trackJson.offline?.downloaded_from_collection?.concat(
              collection
            ) ?? [collection]
        }
      }
      await writeTrackJson(trackIdStr, trackToWrite)
      store.dispatch(loadTrack(track))
      store.dispatch(completeDownload(trackIdStr))
      return
    }

    await downloadCoverArt(track)
    await tryDownloadTrackFromEachCreatorNode(track)
    await writeUserTrackJson(track, collection)
    const verified = await verifyTrack(trackIdStr, true)
    if (verified) {
      store.dispatch(loadTrack(track))
      store.dispatch(completeDownload(trackIdStr))
    } else {
      throw failJob(
        `DownloadQueueWorker - download verification failed ${trackIdStr}`
      )
    }
    return verified
  } catch (e) {
    throw failJob(e.message)
  }
}

export const removeCollectionDownload = async (
  collection: string,
  trackIds: number[]
) => {
  store.dispatch(removeCollection(collection))
  persistCollectionDownloadStatus(collection, false)
  trackIds.forEach(async (trackId) => {
    try {
      const trackIdStr = trackId.toString()
      const diskTrack = await getTrackJson(trackIdStr)
      const collections = diskTrack.offline?.downloaded_from_collection ?? []
      const otherCollections = collections.filter(
        (downloadReasonCollection) => downloadReasonCollection !== collection
      )
      if (otherCollections.length === 0) {
        purgeDownloadedTrack(trackIdStr)
      } else {
        const trackToWrite = {
          ...diskTrack,
          offline: {
            download_completed_time:
              diskTrack.offline?.download_completed_time ?? Date.now(),
            last_verified_time:
              diskTrack.offline?.last_verified_time ?? Date.now(),
            downloaded_from_collection: otherCollections
          }
        }
        await writeTrackJson(trackIdStr, trackToWrite)
      }
    } catch (e) {
      console.debug(
        `failed to remove track ${trackId} from collection ${collection}`
      )
    }
  })
}

/** Unlike mp3 and album art, here we overwrite even if the file exists to ensure we have the latest */
export const writeUserTrackJson = async (
  track: UserTrackMetadata,
  collection: string
) => {
  const trackToWrite: UserTrackMetadata = {
    ...track,
    offline: {
      downloaded_from_collection: uniq([
        collection,
        ...(track?.offline?.downloaded_from_collection ?? [])
      ]),
      download_completed_time: Date.now(),
      last_verified_time: Date.now()
    }
  }

  const pathToWrite = getLocalTrackJsonPath(track.track_id.toString())
  if (await exists(pathToWrite)) {
    await RNFS.unlink(pathToWrite)
  }
  await RNFS.write(pathToWrite, JSON.stringify(trackToWrite))
}

export const downloadCoverArt = async (track: Track) => {
  const coverArtUris = Object.values(track._cover_art_sizes)
  await Promise.all(
    coverArtUris.map(async (coverArtUri) => {
      const destination = getLocalCoverArtDestination(
        track.track_id.toString(),
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
