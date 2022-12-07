import path from 'path'

import type { UserTrackMetadata } from '@audius/common'
import { SquareSizes } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import RNFS, { exists, readDir, readFile } from 'react-native-fs'

import { store } from 'app/store'
import { unloadTrack } from 'app/store/offline-downloads/slice'

export const downloadsRoot = path.join(RNFS.CachesDirectoryPath, 'downloads')

export const getPathFromRoot = (string: string) => {
  return string.replace(downloadsRoot, '~')
}

export const getLocalTracksRoot = () => {
  return path.join(downloadsRoot, `/tracks`)
}

export const getLocalTrackDir = (trackId: string): string => {
  return path.join(getLocalTracksRoot(), trackId)
}

// Track Json

export const getLocalTrackJsonPath = (trackId: string) => {
  return path.join(getLocalTrackDir(trackId), `${trackId}.json`)
}

// Cover Art

export const getLocalCoverArtDestination = (trackId: string, uri: string) => {
  return path.join(getLocalTrackDir(trackId), getArtFileNameFromUri(uri))
}

export const getLocalCoverArtPath = (trackId: string, size: string) => {
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
  return files.filter((file) => file.isDirectory).map((file) => file.name)
}

export const getTrackJson = async (
  trackId: string
): Promise<UserTrackMetadata> => {
  const trackJson = await readFile(getLocalTrackJsonPath(trackId))
  try {
    return JSON.parse(trackJson)
  } catch (e) {
    console.error(e)
    return e
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

/** Debugging method to clear all downloaded content */
export const purgeAllDownloads = async () => {
  const trackIds = await listTracks()
  console.log(`Before purge:`)
  await readDirRec(downloadsRoot)
  await RNFS.unlink(downloadsRoot)
  await RNFS.mkdir(downloadsRoot)
  console.log(`After purge:`)
  await readDirRec(downloadsRoot)
  trackIds.forEach((trackId) => {
    store.dispatch(unloadTrack(trackId))
  })
}

export const persistCollectionDownloadStatus = async (
  collection: string,
  downloaded: boolean
) => {
  try {
    await AsyncStorage.mergeItem(
      '@offline_collections',
      JSON.stringify({
        [collection]: downloaded
      })
    )
  } catch (e) {
    console.warn('Error writing offline collections', e)
  }
}

export const getOfflineCollections = async () => {
  try {
    const offlineCollectionsAsync = await AsyncStorage.getItem(
      '@offline_collections'
    )

    if (!offlineCollectionsAsync) return []

    return Object.entries(JSON.parse(offlineCollectionsAsync))
      .filter(([collection, downloaded]) => downloaded)
      .map(([collection, downloaded]) => collection)
  } catch (e) {
    console.warn('Error reading offline collections', e)
  }
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
