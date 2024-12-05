import type { SquareSizes, WidthSizes, CID } from '@audius/common/models'
import { interleave } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'
import type { ImageSourcePropType, ImageURISource } from 'react-native'

export type ContentNodeImageSource = {
  source: ImageSourcePropType
  handleError: () => void
  isFallbackImage: boolean
}

export const isImageUriSource = (
  source: ImageSourcePropType
): source is ImageURISource => {
  return (source as ImageURISource)?.uri !== undefined
}

/**
 * Create an array of ImageSources for an endpoint and sizes
 */
const createImageSourcesForEndpoints = ({
  endpoints,
  createUri
}: {
  endpoints: string[]
  createUri: (endpoint: string) => string
}): ImageURISource[] =>
  endpoints.reduce((result, endpoint) => {
    const source = {
      uri: createUri(endpoint),
      // A CID is a unique identifier of a piece of content,
      // so we can always rely on a cached value
      // https://reactnative.dev/docs/images#cache-control-ios-only
      cache: 'force-cache' as const
    }

    return [...result, source]
  }, [])

/**
 * Create all the sources for an image.
 * Includes legacy endpoints and optionally lokj cal sources
 */
export const createAllImageSources = <T extends ImageSourcePropType>({
  cid,
  endpoints,
  size,
  localSource,
  cidMap = null
}: {
  cid: Nullable<CID>
  endpoints: string[]
  size: SquareSizes | WidthSizes
  localSource?: T
  cidMap?: Nullable<{ [key: string]: string }>
}) => {
  if (!cid || !endpoints) {
    if (localSource) return [localSource]
    return []
  }
  let cidForSize: Nullable<string> = null
  if (cidMap && cidMap[size]) {
    cidForSize = cidMap[size]
  }

  const newImageSources = createImageSourcesForEndpoints({
    endpoints,
    createUri: (endpoint) =>
      cidForSize
        ? `${endpoint}/content/${cidForSize}`
        : `${endpoint}/content/${cid}/${size}.jpg`
  })

  // These can be removed when all the data on Content Node has
  // been migrated to the new path
  const legacyImageSources = createImageSourcesForEndpoints({
    endpoints,
    createUri: (endpoint) => `${endpoint}${cid}`
  })

  const sourceList = [
    ...(localSource ? [localSource] : []),
    // Alternate between new and legacy paths, so the legacy path is tried for each
    // content node
    ...interleave(newImageSources, legacyImageSources)
  ]
  return sourceList
}
