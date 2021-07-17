import { useEffect } from 'react'

import { useDispatch } from 'react-redux'

import imageEmpty from 'assets/img/imageBlank2x.png'
import imageCoverPhotoBlank from 'assets/img/imageCoverPhotoBlank.jpg'
import profilePicEmpty from 'assets/img/imageProfilePicEmpty2X.png'
import useInstanceVar from 'hooks/useInstanceVar'
import {
  CoverArtSizes,
  CoverPhotoSizes,
  DefaultSizes,
  ImageSizes,
  ProfilePictureSizes,
  SquareSizes,
  URL,
  WidthSizes
} from 'models/common/ImageSizes'
import { fetchCoverArt as fetchCollectionCoverArt } from 'store/cache/collections/actions'
import { fetchCoverArt as fetchTrackCoverArt } from 'store/cache/tracks/actions'
import { fetchCoverPhoto, fetchProfilePicture } from 'store/cache/users/actions'

type SizeArray = Array<SquareSizes | WidthSizes>

/** Gets the width dimension of a size */
const getWidth = (size: SquareSizes | WidthSizes): number =>
  parseInt(size.split('x')[0], 10)

/** Gets all sizes in an array that are greater than the provided size */
const filterGreater = (
  sizes: SizeArray,
  size: SquareSizes | WidthSizes
): SizeArray => {
  return sizes.filter(s => getWidth(s) > getWidth(size))
}

/** Gets all sizes in an array that are less than the provided size */
const filterLess = (
  sizes: SizeArray,
  size: SquareSizes | WidthSizes
): SizeArray => {
  return sizes.filter(s => getWidth(s) < getWidth(size))
}

/** Sorts sizes according to their width dimension */
const sortSizes = (sizes: SizeArray, reverse?: boolean): SizeArray => {
  return reverse
    ? sizes.sort((a, b) => getWidth(b) - getWidth(a))
    : sizes.sort((a, b) => getWidth(a) - getWidth(b))
}

/**
 * Gets the next smallest available image size. If we have images
 * [A > B > C] and we request B, this method returns C.
 */
const getNextSmallest = (
  imageSizes: ImageSizes,
  size: SquareSizes | WidthSizes,
  defaultImage: string
): URL => {
  const keys = Object.keys(imageSizes) as SquareSizes[]
  const nextLargest = sortSizes(filterLess(keys, size))[0]
  if (!nextLargest) return defaultImage
  return (imageSizes as any)[nextLargest]
}

/**
 * Gets the first available larger image size. If we have images
 * [A > B > C] and we request C, this method returns A.
 */
const getLarger = (
  imageSizes: ImageSizes,
  size: SquareSizes | WidthSizes,
  defaultImage: string
): URL | null => {
  const keys = Object.keys(imageSizes) as SquareSizes[]
  const larger = sortSizes(filterGreater(keys, size))[0]
  if (!larger) return defaultImage
  return (imageSizes as any)[larger]
}

type UseImageSizeProps = {
  id?: number | null
  sizes: ImageSizes | null
  size: SquareSizes | WidthSizes
  action: (id: number, size: SquareSizes | WidthSizes) => void
  defaultImage?: string
  onDemand?: boolean
}
/**
 * Custom hooks that allow a component to use an image size for a
 * track, collection, or user's image.
 */
const useImageSize = ({
  id,
  sizes,
  size,
  action,
  defaultImage = '',
  onDemand
}: UseImageSizeProps) => {
  const dispatch = useDispatch()
  const [getPreviousId, setPreviousId] = useInstanceVar<number | null>(null)

  const getImageSize = () => {
    if (id === null || id === undefined) {
      return ''
    }

    // No image sizes object
    if (id !== null && id !== undefined && !sizes) {
      setPreviousId(null)
      return ''
    }

    // Found an override
    // @ts-ignore
    if (DefaultSizes.OVERRIDE in sizes) {
      setPreviousId(null)
      const url = (sizes as any)[DefaultSizes.OVERRIDE]
      if (!url) return defaultImage
      return url
    }

    // Found the requested size
    // @ts-ignore
    if (size in sizes) {
      setPreviousId(null)
      const url = (sizes as any)[size]
      if (!url) return defaultImage
      return url
    }

    // A larger size does exist
    // @ts-ignore
    const larger = getLarger(sizes, size)
    if (larger) {
      setPreviousId(null)
      return larger
    }

    // Request the right size but return the next best option
    if (getPreviousId() !== id) {
      setPreviousId(id)
      // Don't dispatch twice for the same id
      dispatch(action(id, size))
    }
    // @ts-ignore
    return getNextSmallest(sizes, size)
  }

  if (!onDemand) return getImageSize()
  return getImageSize
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

export const useTrackCoverArt = (
  trackId: number | null,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty,
  onDemand = false
) =>
  useImageSize({
    id: trackId,
    sizes: coverArtSizes,
    size,
    action: fetchTrackCoverArt,
    defaultImage,
    onDemand
  })

export const useCollectionCoverArt = (
  collectionId: number,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty,
  onDemand = false
) =>
  useImageSize({
    id: collectionId,
    sizes: coverArtSizes,
    size,
    action: fetchCollectionCoverArt,
    defaultImage,
    onDemand
  })

export const useUserProfilePicture = (
  userId: number | null,
  profilePictureSizes: ProfilePictureSizes | null,
  size: SquareSizes,
  defaultImage: string = profilePicEmpty,
  onDemand = false
) =>
  useImageSize({
    id: userId,
    sizes: profilePictureSizes,
    size,
    action: fetchProfilePicture,
    defaultImage,
    onDemand
  })

export const useUserCoverPhoto = (
  userId: number | null,
  coverPhotoSizes: CoverPhotoSizes | null,
  size: WidthSizes,
  defaultImage: string = imageCoverPhotoBlank,
  onDemand = false
) =>
  useImageSize({
    id: userId,
    sizes: coverPhotoSizes,
    size,
    action: fetchCoverPhoto,
    defaultImage,
    onDemand
  })
