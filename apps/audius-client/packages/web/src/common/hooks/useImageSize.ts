import { useEffect } from 'react'

import { Dispatch } from 'redux'

import useInstanceVar from 'common/hooks/useInstanceVar'
import {
  DefaultSizes,
  ImageSizesObject,
  SquareSizes,
  URL,
  WidthSizes
} from 'common/models/ImageSizes'
import { Maybe } from 'common/utils/typeUtils'

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

type UseImageSizeProps<
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
  // A flag that will cause the return value to be a function that will trigger the image load
  onDemand?: boolean
  // The desired size of the image
  size: ImageSize
  // The available sizes of the image
  sizes: ImageSizes | null
  // Dispatch for current context. Fixes the issue when trying to use web dispatch in mobile context
  dispatch: Dispatch<any>
}

/**
 * Custom hooks that allow a component to use an image size for a
 * track, collection, or user's image.
 *
 * If the desired size is not yet cached, the next best size will be returned.
 * The desired size will be requested and returned when it becomes available
 *
 */
export const useImageSize = <
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
}: UseImageSizeProps<ImageSize, ImageSizes>) => {
  const [getPreviousId, setPreviousId] = useInstanceVar<number | null>(null)

  const fallbackImage = (url: URL) => {
    setPreviousId(null)
    return url
  }

  const getSmallerImage = getNextImage<ImageSize, ImageSizes>((a, b) => a < b)
  const getLargerImage = getNextImage<ImageSize, ImageSizes>((a, b) => a > b)

  const getImageSize = (): Maybe<URL> => {
    if (id === null || id === undefined || typeof id === 'string') {
      return ''
    }

    // No image sizes object
    if (!sizes) {
      return fallbackImage('')
    }

    // An override exists
    if (DefaultSizes.OVERRIDE in sizes) {
      const override: Maybe<URL> = sizes[DefaultSizes.OVERRIDE]
      if (override) {
        return fallbackImage(override)
      }

      return defaultImage
    }

    // The desired size exists
    if (size in sizes) {
      const desired: Maybe<URL> = sizes[size]
      if (desired) {
        return desired
      }

      return defaultImage
    }

    // A larger size exists
    const larger: Maybe<URL> = getLargerImage(sizes, size)
    if (larger) {
      return fallbackImage(larger)
    }

    // If no larger size exists, dispatch to get the desired size
    // Don't dispatch twice for the same id
    if (load && getPreviousId() !== id) {
      setPreviousId(id)
      // Request the desired size
      dispatch(action(id, size))
    }

    // A smaller size exists
    const smaller: Maybe<URL> = getSmallerImage(sizes, size)
    if (smaller) {
      return fallbackImage(smaller)
    }

    return undefined
  }

  // TODO: sk - disambiguate the return value so it can be typed
  if (!onDemand) return getImageSize() as any
  return getImageSize as any
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
