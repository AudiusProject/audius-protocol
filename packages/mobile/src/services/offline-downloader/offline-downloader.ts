import path from 'path'

import type {
  UserCollectionMetadata,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common'
import { SquareSizes, encodeHashId, accountSelectors } from '@audius/common'
import RNFetchBlob from 'rn-fetch-blob'

import { createAllImageSources } from 'app/hooks/useContentNodeImage'
import { store } from 'app/store'

import { apiClient } from '../audius-api-client'

import {
  getLocalAudioPath,
  getLocalTrackCoverArtDestination,
  getLocalCollectionCoverArtDestination,
  mkdirSafe
} from './offline-storage'

const {
  fs: { exists }
} = RNFetchBlob

const { getUserId } = accountSelectors

export const DOWNLOAD_REASON_FAVORITES = 'favorites'

export enum DownloadTrackError {
  IS_DELETED = 'IS_DELETED',
  IS_UNLISTED = 'IS_UNLISTED',
  FAILED_TO_FETCH = 'FAILED_TO_FETCH',
  FAILED_TO_VERIFY = 'FAILED_TO_VERIFY',
  UNKNOWN = 'UNKNOWN'
}

export enum DownloadCollectionError {
  IS_DELETED = 'IS_DELETED',
  IS_PRIVATE = 'IS_PRIVATE',
  FAILED_TO_FETCH = 'FAILED_TO_FETCH',
  UNKNOWN = 'UNKNOWN'
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

/** Download file at uri to destination unless there is already a file at that location or overwrite is true */
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
