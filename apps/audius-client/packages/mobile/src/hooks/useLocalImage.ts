import { useCallback, useMemo } from 'react'

import { SquareSizes } from '@audius/common'
import type { ImageURISource } from 'react-native'
import { exists } from 'react-native-fs'
import { useAsync } from 'react-use'
import type { AsyncState } from 'react-use/lib/useAsync'

import {
  getLocalCollectionCoverArtPath,
  getLocalTrackCoverArtPath
} from 'app/services/offline-downloader'

export const useLocalCollectionImage = (trackId?: string) => {
  const getLocalPath = useCallback(
    (size: string) =>
      trackId ? getLocalCollectionCoverArtPath(trackId, size) : undefined,
    [trackId]
  )
  return useLocalImage(getLocalPath)
}

export const useLocalTrackImage = (trackId?: string) => {
  const getLocalPath = useCallback(
    (size: string) =>
      trackId ? getLocalTrackCoverArtPath(trackId, size) : undefined,
    [trackId]
  )
  return useLocalImage(getLocalPath)
}

export const useLocalImage = (
  getLocalPath: (size: string) => string | undefined
): AsyncState<ImageURISource[]> => {
  const imageSources = useMemo(
    () =>
      Object.values(SquareSizes)
        .reverse()
        .map(
          (size): ImageURISource => ({
            uri: `file://${getLocalPath(size.toString())}`,
            width: parseInt(size.split('x')[0]),
            height: parseInt(size.split('x')[1])
          })
        )
        .filter((source) => !!source.uri),
    [getLocalPath]
  )

  return useAsync(async () => {
    const verifiedSources: ImageURISource[] = []
    for (const source of imageSources) {
      if (source?.uri && (await exists(source.uri))) {
        verifiedSources.push(source)
      }
    }
    return verifiedSources
  }, [getLocalPath, imageSources])
}
