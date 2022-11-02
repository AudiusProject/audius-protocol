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
  startDownload
} from 'app/store/offline-downloads/slice'

import { apiClient } from '../audius-api-client'

import {
  getLocalAudioPath,
  getLocalCoverArtPath,
  getLocalTrackJsonPath,
  verifyTrack
} from './offline-storage'
const { getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors
const { getUser } = cacheUsersSelectors

export const DOWNLOAD_REASON_FAVORITES = 'favorites'

/** Main entrypoint - perform all steps required to complete a download */
export const downloadTrack = async (trackId: number, collection: string) => {
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
    await downloadCoverArt(track)
    await tryDownloadTrackFromEachCreatorNode(track)
    await writeTrackJson(track, user, collection)
    const verified = await verifyTrack(trackIdString)
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

/** Unlike mp3 and album art, here we overwrite even if the file exists to ensure we have the latest */
const writeTrackJson = async (track: Track, user: User, collection: string) => {
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
