import { useCallback, useEffect, useMemo } from 'react'

import { Dispatch } from 'redux'

import {
  DefaultSizes,
  ImageSizesObject,
  SquareSizes,
  URL,
  WidthSizes
} from '../models/ImageSizes'
import { Maybe } from '../utils/typeUtils'

import { useInstanceVar } from './useInstanceVar'

type Size = SquareSizes | WidthSizes

/** Gets the width dimension of a size */
const getWidth = (size: Size): number => parseInt(size.split('x')[0], 10)

/** Sorts sizes according to their width dimension */
const sortSizes = <ImageSize extends Size>(sizes: ImageSize[]): ImageSize[] => {
  return sizes.sort((a, b) => getWidth(b) - getWidth(a))
}

/**
 * Gets the next available image size (sorted largest to smallest) meeting a condition
 */
const getNextImage =
  <ImageSize extends Size, ImageSizes extends ImageSizesObject<ImageSize>>(
    condition: (desiredWidth: number, currentWidth: number) => boolean
  ) =>
  (imageSizes: ImageSizes, size: ImageSize) => {
    const keys = Object.keys(imageSizes) as ImageSize[]

    const desiredWidth = getWidth(size)
    const sorted = sortSizes(
      keys.filter((s) => condition(getWidth(s), desiredWidth))
    )
    const next = sorted[0]
    return imageSizes[next]
  }

export type BaseUserImageSizeProps<
  ImageSize extends Size,
  ImageSizes extends ImageSizesObject<ImageSize>
> = {
  // The action to dispatch to fetch the desired size
  action: (id: number, size: ImageSize) => void
  // The fallback if no sizes are available
  defaultImage?: string
  // A unique id (used to prevent duplicate fetches)
  id?: number | null | undefined | string
  // A flag (default = true) that will trigger the image load. Can be used to delay the load
  load?: boolean
  // The desired size of the image
  size: ImageSize
  // The available sizes of the image
  sizes: ImageSizes | null
  // Dispatch for current context. Fixes the issue when trying to use web dispatch in mobile context
  dispatch: Dispatch<any>
}

type UseImageSizeOnDemandProps<
  ImageSize extends Size,
  ImageSizes extends ImageSizesObject<ImageSize>
> = BaseUserImageSizeProps<ImageSize, ImageSizes> & {
  // A flag that will cause the return value to be a function that will trigger the image load
  onDemand: true
}

type ImageType =
  | 'empty'
  | 'none'
  | 'override'
  | 'default'
  | 'desired'
  | 'smaller'
  | 'larger'
  | 'undefined'

/**
 * Custom hooks that allow a component to use an image size for a
 * track, collection, or user's image.
 *
 * If the desired size is not yet cached, the next best size will be returned.
 * The desired size will be requested and returned when it becomes available
 *
 */
export function useImageSize<
  ImageSize extends Size,
  ImageSizes extends ImageSizesObject<ImageSize>
>(props: UseImageSizeOnDemandProps<ImageSize, ImageSizes>): () => Maybe<string>
export function useImageSize<
  ImageSize extends Size,
  ImageSizes extends ImageSizesObject<ImageSize>
>(props: BaseUserImageSizeProps<ImageSize, ImageSizes>): Maybe<string>
export function useImageSize<
  ImageSize extends Size,
  ImageSizes extends ImageSizesObject<ImageSize>
>({
  action,
  defaultImage = '',
  dispatch,
  id,
  load = true,
  onDemand,
  size,
  sizes
}: BaseUserImageSizeProps<ImageSize, ImageSizes> & {
  onDemand?: boolean
}): string | number | undefined | (() => Maybe<string | number>) {
  const [getPreviousId, setPreviousId] = useInstanceVar<number | null>(null)

  const getSmallerImage = useMemo(
    () => getNextImage<ImageSize, ImageSizes>((a, b) => a < b),
    []
  )
  const getLargerImage = useMemo(
    () => getNextImage<ImageSize, ImageSizes>((a, b) => a > b),
    []
  )

  const getImageSize = useCallback((): {
    url: Maybe<URL | number>
    type: ImageType
  } => {
    if (id === null || id === undefined || typeof id === 'string') {
      return { url: '', type: 'empty' }
    }

    const fallbackImage = (url: URL | number) => {
      setPreviousId(null)
      return url
    }

    // No image sizes object
    if (!sizes) {
      return { url: fallbackImage(''), type: 'none' }
    }

    // An override exists
    if (DefaultSizes.OVERRIDE in sizes) {
      const override: Maybe<URL | number> = sizes[DefaultSizes.OVERRIDE]
      if (override) {
        return { url: fallbackImage(override), type: 'override' }
      }

      return { url: defaultImage, type: 'default' }
    }

    // The desired size exists
    if (size in sizes) {
      const desired: Maybe<URL> = sizes[size]
      if (desired) {
        return { url: desired, type: 'desired' }
      }

      return { url: defaultImage, type: 'default' }
    }

    // A larger size exists
    const larger: Maybe<URL> = getLargerImage(sizes, size)
    if (larger) {
      return { url: fallbackImage(larger), type: 'larger' }
    }

    // A smaller size exists
    const smaller: Maybe<URL> = getSmallerImage(sizes, size)
    if (smaller) {
      return { url: fallbackImage(smaller), type: 'smaller' }
    }

    return { url: undefined, type: 'undefined' }
  }, [
    defaultImage,
    getLargerImage,
    getSmallerImage,
    id,
    size,
    sizes,
    setPreviousId
  ])

  let imageUrl: Maybe<URL | number>
  let imageType: Maybe<ImageType>

  if (!onDemand) {
    const { url, type } = getImageSize()
    imageUrl = url
    imageType = type
  }

  const previousId = getPreviousId()

  const handleFetchLargeImage = useCallback(
    (imageType: ImageType) => {
      if (
        load &&
        !(id === null || id === undefined || typeof id === 'string') &&
        previousId !== id &&
        (imageType === 'smaller' || imageType === 'undefined')
      ) {
        setPreviousId(id)
        dispatch(action(id, size))
      }
    },
    [load, id, previousId, action, dispatch, setPreviousId, size]
  )

  const handleOnDemandImage = useCallback(() => {
    const { url, type } = getImageSize()
    handleFetchLargeImage(type)
    return url
  }, [getImageSize, handleFetchLargeImage])

  useEffect(() => {
    if (!onDemand && imageType !== undefined) {
      handleFetchLargeImage(imageType)
    }
  }, [onDemand, handleFetchLargeImage, imageType])

  if (!onDemand) return imageUrl
  return handleOnDemandImage
}

const ARTWORK_HAS_LOADED_TIMEOUT = 1000
// We don't want to indefinitely delay tile loading
// waiting for the image, so set a timeout before
// we call callback().
export const useLoadImageWithTimeout = (
  image: any,
  callback?: () => void,
  timeout: number = ARTWORK_HAS_LOADED_TIMEOUT
) => {
  const [getDidCallback, setDidCallback] = useInstanceVar(false)

  useEffect(() => {
    const t = setTimeout(() => {
      if (!image) {
        if (callback) callback()
        setDidCallback(true)
      }
    }, timeout)
    return () => clearTimeout(t)
  }, [image, callback, timeout, setDidCallback])

  useEffect(() => {
    if (image && !getDidCallback() && callback) callback()
  }, [image, callback, getDidCallback])
}
