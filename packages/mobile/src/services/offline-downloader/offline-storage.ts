import path from 'path'

import type { Track } from '@audius/common'
import RNFS, { exists } from 'react-native-fs'

export const downloadsRoot = path.join(RNFS.CachesDirectoryPath, 'downloads')

export const getPathFromRoot = (string: string) => {
  return string.replace(downloadsRoot, '~')
}

export const getLocalTracksRoot = () => {
  return path.join(downloadsRoot, `/tracks`)
}

export const getLocalTrackDir = (track: Track): string => {
  return path.join(getLocalTracksRoot(), track.track_id.toString())
}

// Track Json

export const getLocalTrackJsonPath = (track: Track) => {
  return path.join(getLocalTrackDir(track), `${track.track_id}.json`)
}

// Cover Art

export const getLocalCoverArtPath = (track: Track, uri: string) => {
  return path.join(getLocalTrackDir(track), getArtFileNameFromUri(uri))
}

export const getArtFileNameFromUri = (uri: string) => {
  // This should be "150x150.jpg" or similar
  return uri.split('/').slice(-1)[0]
}

// Audio

export const getLocalAudioPath = (track: Track): string => {
  return path.join(getLocalTrackDir(track), `${track.track_id}.mp3`)
}

export const isAudioAvailableOffline = async (track: Track) => {
  return await exists(getLocalAudioPath(track))
}

// Storage management

/** Debugging method to clear all downloaded content */
export const purgeAllDownloads = async () => {
  console.log(`Before purge:`)
  await readDirRec(downloadsRoot)
  await RNFS.unlink(downloadsRoot)
  await RNFS.mkdir(downloadsRoot)
  console.log(`After purge:`)
  await readDirRec(downloadsRoot)
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
