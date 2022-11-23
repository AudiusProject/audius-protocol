import { useState, useMemo, useCallback } from 'react'

import type { Nullable, CID, WidthSizes } from '@audius/common'
import { SquareSizes } from '@audius/common'
import type { User } from '@sentry/react-native'
import type { ImageSourcePropType } from 'react-native'

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
      uri: createUri(size)
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

type UseContentNodeImageOptions = {
  cid: Nullable<CID>
  user: Nullable<Pick<User, 'creator_node_endpoint'>>
  sizes?: typeof SquareSizes | typeof WidthSizes
  fallbackImageSource: ImageSourcePropType
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
  fallbackImageSource
}: UseContentNodeImageOptions): ContentNodeImageSource => {
  const [imageSourceIndex, setImageSourceIndex] = useState(0)
  const [failedToLoad, setFailedToLoad] = useState(false)

  const endpoints = useMemo(
    () =>
      user?.creator_node_endpoint
        ? audiusBackendInstance.getCreatorNodeIPFSGateways(
            user.creator_node_endpoint
          )
        : [],
    [user?.creator_node_endpoint]
  )

  // Create an array of ImageSources
  // based on the content node endpoints
  const imageSources = useMemo(() => {
    if (!cid) {
      return []
    }

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

    return [...newImageSources, ...legacyImageSources]
  }, [cid, endpoints, sizes])

  const handleError = useCallback(() => {
    if (imageSourceIndex < imageSources.length - 1) {
      // Image failed to load from the current node
      setImageSourceIndex(imageSourceIndex + 1)
    } else {
      // Image failed to load from any node in replica set
      setFailedToLoad(true)
    }
  }, [imageSourceIndex, imageSources.length])

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
