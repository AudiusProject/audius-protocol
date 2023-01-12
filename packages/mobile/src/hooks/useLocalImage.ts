import { useCallback } from 'react'

import { SquareSizes, reachabilitySelectors } from '@audius/common'
import type { ImageURISource } from 'react-native'
import { exists } from 'react-native-fs'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'
import type { AsyncState } from 'react-use/lib/useAsync'

import {
  getLocalCollectionCoverArtPath,
  getLocalTrackCoverArtPath
} from 'app/services/offline-downloader'
const { getIsReachable } = reachabilitySelectors

const getLocalTrackImagePath = (trackId?: string) => (size: string) =>
  trackId ? getLocalTrackCoverArtPath(trackId, size) : undefined

const getLocalCollectionImagePath = (collectionId?: string) => (size: string) =>
  collectionId ? getLocalCollectionCoverArtPath(collectionId, size) : undefined

export const getLocalTrackImageSource = (trackId?: string) => {
  return getLocalImageSource(getLocalTrackImagePath(trackId))
}

export const getLocalCollectionImageSource = (collectionId?: string) => {
  return getLocalImageSource(getLocalCollectionImagePath(collectionId))
}

export const getLocalImageSource = async (
  getLocalPath: (size: string) => string | undefined
) => {
  const imageSources = Object.values(SquareSizes)
    .reverse()
    .map(
      (size): ImageURISource => ({
        uri: `file://${getLocalPath(size.toString())}`,
        width: parseInt(size.split('x')[0]),
        height: parseInt(size.split('x')[1])
      })
    )
    .filter((source) => !!source.uri)

  const verifiedSources: ImageURISource[] = []
  for (const source of imageSources) {
    if (source?.uri && (await exists(source.uri))) {
      verifiedSources.push(source)
    }
  }
  return verifiedSources
}

export const useLocalImage = (
  getLocalPath: (size: string) => string | undefined
): AsyncState<ImageURISource[]> => {
  const isNotReachable = useSelector(getIsReachable) === false

  return useAsync(async () => {
    // Only check for local images if not reachable
    if (isNotReachable) {
      return []
    }

    return await getLocalImageSource(getLocalPath)
  }, [getLocalPath])
}

export const useLocalTrackImage = (trackId?: string) => {
  const getLocalPath = useCallback(
    (size: string) => getLocalTrackImagePath(trackId)(size),
    [trackId]
  )
  return useLocalImage(getLocalPath)
}

export const useLocalCollectionImage = (collectionId?: string) => {
  const getLocalPath = useCallback(
    (size: string) => getLocalCollectionImagePath(collectionId)(size),
    [collectionId]
  )
  return useLocalImage(getLocalPath)
}
