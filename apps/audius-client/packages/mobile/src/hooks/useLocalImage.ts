import type { Nullable } from '@audius/common'
import { reachabilitySelectors } from '@audius/common'
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

export const getLocalImageSource = async (localPath: string | undefined) => {
  const imageSource = {
    uri: `file://${localPath}`
  }

  if (!(await exists(imageSource.uri))) {
    return null
  }

  return imageSource
}

const getLocalTrackImagePath = (trackId?: string) =>
  trackId ? getLocalTrackCoverArtPath(trackId) : undefined

const getLocalCollectionImagePath = (collectionId?: string) =>
  collectionId ? getLocalCollectionCoverArtPath(collectionId) : undefined

export const getLocalTrackImageSource = (trackId: string) => {
  return getLocalImageSource(getLocalTrackImagePath(trackId))
}

export const getLocalCollectionImageSource = (collectionId: string) => {
  return getLocalImageSource(getLocalCollectionImagePath(collectionId))
}

// When reachable, return empty array for local source.
// defined here to have a single reference and avoid rerenders
const reachableResult: AsyncState<Nullable<ImageURISource>> = {
  value: null,
  loading: false
}

export const useLocalImage = (
  imagePath?: string
): AsyncState<Nullable<ImageURISource>> => {
  const isReachable = useSelector(getIsReachable)

  const sourceResult = useAsync(async () => {
    // If reachable, don't check for local images
    if (isReachable) {
      return null
    }

    return await getLocalImageSource(imagePath)
  }, [imagePath])

  if (isReachable) {
    return reachableResult
  }

  return sourceResult
}

export const useLocalTrackImage = (trackId?: string) => {
  return useLocalImage(getLocalTrackImagePath(trackId))
}

export const useLocalCollectionImage = (collectionId?: string) => {
  return useLocalImage(getLocalCollectionImagePath(collectionId))
}
