import path from 'path'

import type {
  Collection,
  Track,
  User,
  UserMetadata,
  UserTrackMetadata
} from '@audius/common'
import { SquareSizes } from '@audius/common'
import RNFS, { exists, readDir, readFile } from 'react-native-fs'

import { store } from 'app/store'
import {
  removeCollection,
  unloadTrack
} from 'app/store/offline-downloads/slice'

import { DOWNLOAD_REASON_FAVORITES } from './offline-downloader'

export type OfflineCollection = Collection & { user: UserMetadata }

export const downloadsRoot = path.join(RNFS.CachesDirectoryPath, 'downloads')

export const getPathFromRoot = (string: string) => {
  return string.replace(downloadsRoot, '~')
}

export const getLocalCollectionsRoot = () => {
  return path.join(downloadsRoot, `/collections`)
}

export const getLocalCollectionDir = (collectionId: string): string => {
  return path.join(getLocalCollectionsRoot(), collectionId)
}

export const getLocalTracksRoot = () => {
  return path.join(downloadsRoot, `/tracks`)
}

export const getLocalTrackDir = (trackId: string): string => {
  return path.join(getLocalTracksRoot(), trackId)
}

// Collections

export const getLocalCollectionJsonPath = (collectionId: string) => {
  return path.join(getLocalCollectionDir(collectionId), `${collectionId}.json`)
}

export const writeCollectionJson = async (
  collectionId: string,
  collectionToWrite: Collection,
  user: User
) => {
  const pathToWrite = getLocalCollectionJsonPath(collectionId)
  if (await exists(pathToWrite)) {
    await RNFS.unlink(pathToWrite)
  }
  await RNFS.mkdir(getLocalCollectionDir(collectionId))
  await RNFS.write(
    pathToWrite,
    JSON.stringify({
      ...collectionToWrite,
      user
    })
  )
}

// Special case for favorites which is not a real collection with metadata
export const writeFavoritesCollectionJson = async () => {
  const pathToWrite = getLocalCollectionDir(DOWNLOAD_REASON_FAVORITES)
  if (await exists(pathToWrite)) {
    await RNFS.unlink(pathToWrite)
  }
  RNFS.mkdir(pathToWrite)
}

export const getCollectionJson = async (
  collectionId: string
): Promise<OfflineCollection> => {
  try {
    const collectionJson = await readFile(
      getLocalCollectionJsonPath(collectionId)
    )
    return JSON.parse(collectionJson)
  } catch (e) {
    if (e instanceof SyntaxError) {
      purgeDownloadedCollection(collectionId)
    }
    return Promise.reject(e)
  }
}

export const getOfflineCollections = async () => {
  const collectionsDir = getLocalCollectionsRoot()
  if (!(await exists(collectionsDir))) {
    return []
  }
  const files = await readDir(collectionsDir)
  return files.filter((file) => file.isDirectory()).map((file) => file.name)
}

export const purgeDownloadedCollection = async (collectionId: string) => {
  const collectionDir = getLocalCollectionDir(collectionId)
  if (!(await exists(collectionDir))) return
  await RNFS.unlink(collectionDir)
  store.dispatch(removeCollection(collectionId))
}

// Track Json

export const getLocalTrackJsonPath = (trackId: string) => {
  return path.join(getLocalTrackDir(trackId), `${trackId}.json`)
}

// Cover Art

export const getLocalCollectionCoverArtDestination = (
  collectionId: string,
  uri: string
) => {
  return path.join(
    getLocalCollectionDir(collectionId),
    getArtFileNameFromUri(uri)
  )
}

export const getLocalCollectionCoverArtPath = (
  collectionId: string,
  size: string
) => {
  return path.join(getLocalCollectionDir(collectionId), `${size}.jpg`)
}

export const getLocalTrackCoverArtDestination = (
  trackId: string,
  uri: string
) => {
  return path.join(getLocalTrackDir(trackId), getArtFileNameFromUri(uri))
}

export const getLocalTrackCoverArtPath = (trackId: string, size: string) => {
  return path.join(getLocalTrackDir(trackId), `${size}.jpg`)
}

export const getArtFileNameFromUri = (uri: string) => {
  // This should be "150x150.jpg" or similar
  return uri.split('/').slice(-1)[0]
}

// Audio

export const getLocalAudioPath = (trackId: string): string => {
  return path.join(getLocalTrackDir(trackId), `${trackId}.mp3`)
}

export const isAudioAvailableOffline = async (trackId: string) => {
  return await exists(getLocalAudioPath(trackId))
}

// Storage management

export const listTracks = async (): Promise<string[]> => {
  const tracksDir = getLocalTracksRoot()
  if (!(await exists(tracksDir))) {
    return []
  }
  const files = await readDir(tracksDir)
  return files.filter((file) => file.isDirectory()).map((file) => file.name)
}

export const getTrackJson = async (
  trackId: string
): Promise<Track & UserTrackMetadata> => {
  try {
    const trackJson = await readFile(getLocalTrackJsonPath(trackId))
    return JSON.parse(trackJson)
  } catch (e) {
    if (e instanceof SyntaxError) {
      purgeDownloadedTrack(trackId)
    }
    return Promise.reject(e)
  }
}

export const writeTrackJson = async (
  trackId: string,
  trackToWrite: UserTrackMetadata
) => {
  const pathToWrite = getLocalTrackJsonPath(trackId)
  if (await exists(pathToWrite)) {
    await RNFS.unlink(pathToWrite)
  }
  await RNFS.write(pathToWrite, JSON.stringify(trackToWrite))
}

export const verifyTrack = async (
  trackId: string,
  expectTrue?: boolean
): Promise<boolean> => {
  const audioFile = exists(getLocalAudioPath(trackId))
  const jsonFile = exists(getLocalTrackJsonPath(trackId))
  const artFiles = Object.values(SquareSizes).map((size) =>
    exists(path.join(getLocalTrackDir(trackId), `${size}.jpg`))
  )

  const results = await Promise.allSettled([audioFile, jsonFile, ...artFiles])
  const booleanResults = results.map(
    (result) => result.status === 'fulfilled' && !!result.value
  )
  const [audioExists, jsonExists, ...artExists] = booleanResults

  if (expectTrue) {
    !audioExists && console.warn(`Missing audio for ${trackId}`)
    !jsonExists && console.warn(`Missing json for ${trackId}`)
    !artExists?.length && console.warn(`Missing art for ${trackId}`)
  }

  return booleanResults.every((result) => result)
}

export const purgeAllDownloads = async (withLogs?: boolean) => {
  if (withLogs) {
    console.log(`Before purge:`)
  }
  await readDirRec(downloadsRoot)
  await RNFS.unlink(downloadsRoot)
  await RNFS.mkdir(downloadsRoot)
  if (withLogs) {
    console.log(`After purge:`)
  }
  await readDirRec(downloadsRoot)
}

export const purgeDownloadedTrack = async (trackId: string) => {
  const trackDir = getLocalTrackDir(trackId)
  if (!(await exists(trackDir))) return
  await RNFS.unlink(trackDir)
  store.dispatch(unloadTrack(trackId))
}

/** Debugging method to read cached files */
export const readDirRec = async (path: string) => {
  const files = await RNFS.readDir(path)
  if (files.length === 0) {
    console.log(`${getPathFromRoot(path)} - empty`)
  }
  files.forEach((item) => {
    if (item.isFile()) {
      console.log(`${getPathFromRoot(item.path)} - ${item.size} bytes`)
    }
  })
  await Promise.all(
    files.map(async (item) => {
      if (item.isDirectory()) {
        await readDirRec(item.path)
      }
    })
  )
}

export const readDirRoot = async () => await readDirRec(downloadsRoot)
