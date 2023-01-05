import { useState, useMemo, useCallback } from 'react'

import type { Nullable, CID, WidthSizes } from '@audius/common'
import { SquareSizes } from '@audius/common'
import type { User } from '@sentry/react-native'
import type { ImageSourcePropType, ImageURISource } from 'react-native'

import { audiusBackendInstance } from 'app/services/audius-backend-instance'

export type ContentNodeImageSource = {
  source: ImageSourcePropType
  handleError: () => void
}

/**
 * Create an ImageSourceUri[] containing the available
 * images sizes
 */
const createImageSourceWithSizes = ({
  sizes,
  createUri
}: {
  sizes: typeof SquareSizes | typeof WidthSizes
  createUri: (size: string) => string
}) => {
  return Object.values(sizes).map((size: string) => {
    const width = Number(size.split('x')[0])
    return {
      width,
      height: width,
      uri: createUri(size),
      // A CID is a unique identifier of a piece of content,
      // so we can always rely on a cached value
      // https://reactnative.dev/docs/images#cache-control-ios-only
      cache: 'force-cache' as const
    }
  })
}

/**
 * Create an array of ImageSources for an endpoint and sizes
 */
const createImageSourcesForEndpoints = ({
  endpoints,
  sizes,
  createUri
}: {
  endpoints: string[]
  sizes: typeof SquareSizes | typeof WidthSizes
  createUri: (endpoint: string) => (size: string) => string
}) =>
  endpoints.reduce((result, endpoint) => {
    const source = createImageSourceWithSizes({
      sizes,
      createUri: createUri(endpoint)
    })

    return [...result, source]
  }, [])

/**
 * Create all the sources for an image.
 * Includes legacy endpoints and optionally local sources
 */
const createAllImageSources = ({
  cid,
  user,
  sizes = SquareSizes,
  localSource
}: {
  cid: Nullable<CID>
  user: Nullable<{ creator_node_endpoint: Nullable<string> }>
  sizes?: typeof SquareSizes | typeof WidthSizes
  localSource?: ImageURISource[] | null
}) => {
  if (!cid || !user) {
    return []
  }

  const endpoints = user.creator_node_endpoint
    ? audiusBackendInstance.getCreatorNodeIPFSGateways(
        user.creator_node_endpoint
      )
    : []

  const newImageSources = createImageSourcesForEndpoints({
    endpoints,
    sizes,
    createUri: (endpoint) => (size) => `${endpoint}${cid}/${size}.jpg`
  })

  // These can be removed when all the data on Content Node has
  // been migrated to the new path
  const legacyImageSources = createImageSourcesForEndpoints({
    endpoints,
    sizes,
    createUri: (endpoint) => () => `${endpoint}${cid}`
  })

  const sourceList = [
    ...(localSource && localSource.length > 0 ? [localSource] : []),
    ...newImageSources,
    ...legacyImageSources
  ]
  return sourceList
}

/**
 * Return the first image source, usually the user's primary
 * or a local source. This is useful for cases where there is no error
 * callback if the image fails to load - like the MusicControls on the lockscreen
 */
export const getImageSourceOptimistic = (
  options: Parameters<typeof createAllImageSources>[0]
) => {
  const allImageSources = createAllImageSources(options)
  return allImageSources[0]
}

type UseContentNodeImageOptions = {
  cid: Nullable<CID>
  user: Nullable<Pick<User, 'creator_node_endpoint'>>
  sizes?: typeof SquareSizes | typeof WidthSizes
  fallbackImageSource: ImageSourcePropType
  localSource?: ImageURISource[] | null
}

/**
 * Load an image from a user's replica set
 *
 * If the image fails to load, try the next node in the replica set
 *
 * Returns props for the DynamicImage component
 * @returns {
 *  source: ImageSource
 *  onError: () => void
 * }
 */
export const useContentNodeImage = ({
  cid,
  user,
  sizes = SquareSizes,
  fallbackImageSource,
  localSource
}: UseContentNodeImageOptions): ContentNodeImageSource => {
  const [imageSourceIndex, setImageSourceIndex] = useState(0)
  const [failedToLoad, setFailedToLoad] = useState(false)

  // Create an array of ImageSources
  // based on the content node endpoints
  const imageSources = useMemo(() => {
    return createAllImageSources({
      cid,
      user,
      localSource,
      sizes
    })
  }, [cid, user, localSource, sizes])

  const handleError = useCallback(() => {
    if (imageSourceIndex < imageSources.length - 1) {
      // Image failed to load from the current node
      setImageSourceIndex(imageSourceIndex + 1)
    } else {
      // Image failed to load from any node in replica set
      setFailedToLoad(true)
    }
  }, [imageSourceIndex, imageSources])

  const result = useMemo(
    () => ({
      source:
        !user || !cid || failedToLoad
          ? fallbackImageSource
          : imageSources[imageSourceIndex],
      handleError
    }),
    [
      imageSources,
      imageSourceIndex,
      handleError,
      fallbackImageSource,
      failedToLoad,
      user,
      cid
    ]
  )

  return result
}
