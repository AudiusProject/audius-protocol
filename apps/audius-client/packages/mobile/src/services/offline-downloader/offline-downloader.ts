import path from 'path'

import type { Track, UserMetadata } from '@audius/common'
import {
  encodeHashId,
  accountSelectors,
  cacheTracksSelectors
} from '@audius/common'
import { uniq } from 'lodash'
import RNFS, { exists } from 'react-native-fs'

import { store } from 'app/store'

import { apiClient } from '../audius-api-client'

import {
  getLocalAudioPath,
  getLocalCoverArtPath,
  getLocalTrackJsonPath
} from './offline-storage'
const { getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors

/** Main entrypoint - perform all steps required to complete a download */
export const downloadTrack = async (trackId: number, collection: string) => {
  const state = store.getState()
  const track = getTrack(state, { id: trackId })
  if (!track) return false

  await downloadCoverArt(track)
  await tryDownloadTrackFromEachCreatorNode(track)
  await writeTrackJson(track, collection)
}

/** Unlike mp3 and album art, here we overwrite even if the file exists to ensure we have the latest */
const writeTrackJson = async (track: Track, collection: string) => {
  const trackToWrite: Track = {
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

  const pathToWrite = getLocalTrackJsonPath(track)
  await RNFS.write(pathToWrite, JSON.stringify(trackToWrite))
}

const downloadCoverArt = async (track: Track) => {
  // TODO: computed _cover_art_sizes isn't necessarily populated
  const coverArtUris = Object.values(track._cover_art_sizes)
  await Promise.all(
    coverArtUris.map(async (coverArtUri) => {
      const destination = getLocalCoverArtPath(track, coverArtUri)
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
  const destination = getLocalAudioPath(track)

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
