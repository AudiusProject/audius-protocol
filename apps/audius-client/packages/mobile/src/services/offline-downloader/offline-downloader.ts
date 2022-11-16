import path from 'path'

import type {
  Track,
  User,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common'
import {
  encodeHashId,
  accountSelectors,
  cacheTracksSelectors,
  cacheUsersSelectors
} from '@audius/common'
import { uniq } from 'lodash'
import RNFS, { exists } from 'react-native-fs'

import { store } from 'app/store'
import {
  completeDownload,
  errorDownload,
  loadTrack,
  removeDownload,
  startDownload
} from 'app/store/offline-downloads/slice'

import { apiClient } from '../audius-api-client'

import {
  getLocalAudioPath,
  getLocalCoverArtPath,
  getLocalTrackJsonPath,
  getTrackJson,
  markCollectionDownloaded,
  purgeDownloadedTrack,
  verifyTrack,
  writeTrackJson
} from './offline-storage'
const { getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors
const { getUser } = cacheUsersSelectors

export const DOWNLOAD_REASON_FAVORITES = 'favorites'

/** Main entrypoint - perform all steps required to complete a download for each track */
export const downloadCollection = async (
  collection: string,
  trackIds: number[]
) => {
  store.dispatch(startDownload(collection))
  markCollectionDownloaded(collection, true)

  try {
    await Promise.allSettled(
      trackIds.map((trackId) => downloadTrack(trackId, collection))
    )
    store.dispatch(completeDownload(collection))
  } catch (e) {
    store.dispatch(errorDownload(collection))
  }
}

const downloadTrack = async (trackId: number, collection: string) => {
  const state = store.getState()
  const track = getTrack(state, { id: trackId })
  const user = getUser(state, { id: track?.owner_id })
  const trackIdString = trackId.toString()
  if (!track || !user) {
    // TODO: try getting it from the API
    store.dispatch(errorDownload(trackIdString))
    return false
  }

  store.dispatch(startDownload(trackIdString))
  try {
    if (await verifyTrack(trackIdString, false)) {
      // Track already downloaded, so rewrite the json
      // to include this collection in the downloaded_from_collection list
      const trackJson = await getTrackJson(trackIdString)
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
      await writeTrackJson(trackIdString, trackToWrite)
      store.dispatch(loadTrack(track))
      store.dispatch(completeDownload(trackIdString))
      return
    }

    await downloadCoverArt(track)
    await tryDownloadTrackFromEachCreatorNode(track)
    await writeUserTrackJson(track, user, collection)
    const verified = await verifyTrack(trackIdString, true)
    if (verified) {
      store.dispatch(loadTrack(track))
      store.dispatch(completeDownload(trackIdString))
    } else {
      store.dispatch(errorDownload(trackIdString))
    }
    return verified
  } catch (e) {
    store.dispatch(errorDownload(trackIdString))
    console.error(e)
    return false
  }
}

export const removeCollectionDownload = async (
  collection: string,
  trackIds: number[]
) => {
  store.dispatch(removeDownload(collection))
  markCollectionDownloaded(collection, false)
  trackIds.forEach(async (trackId) => {
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
  })
}

/** Unlike mp3 and album art, here we overwrite even if the file exists to ensure we have the latest */
const writeUserTrackJson = async (
  track: Track,
  user: User,
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
    },
    user
  }

  const pathToWrite = getLocalTrackJsonPath(track.track_id.toString())
  if (await exists(pathToWrite)) {
    await RNFS.unlink(pathToWrite)
  }
  await RNFS.write(pathToWrite, JSON.stringify(trackToWrite))
}

const downloadCoverArt = async (track: Track) => {
  // TODO: computed _cover_art_sizes isn't necessarily populated
  const coverArtUris = Object.values(track._cover_art_sizes)
  await Promise.all(
    coverArtUris.map(async (coverArtUri) => {
      const destination = getLocalCoverArtPath(
        track.track_id.toString(),
        coverArtUri
      )
      await downloadIfNotExists(coverArtUri, destination)
    })
  )
}

const tryDownloadTrackFromEachCreatorNode = async (track: Track) => {
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
