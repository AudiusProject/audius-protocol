import {
  CoverPhotoSizes,
  WidthSizes,
  useImageSize,
  cacheUsersActions,
  imageCoverPhotoBlank,
  cacheUsersSelectors,
  SquareSizes
} from '@audius/common'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

import { useProfilePicture } from './useUserProfilePicture'

const { fetchCoverPhoto } = cacheUsersActions
const { getUser } = cacheUsersSelectors

/**
 * @deprecated Use useCoverPhoto instead
 */
export const useUserCoverPhoto = (
  userId: number | null,
  coverPhotoSizes: CoverPhotoSizes | null,
  size: WidthSizes,
  defaultImage: string = imageCoverPhotoBlank as string
) => {
  const dispatch = useDispatch()
  const profilePhoto = useProfilePicture(
    userId,
    size === WidthSizes.SIZE_640
      ? SquareSizes.SIZE_480_BY_480
      : SquareSizes.SIZE_1000_BY_1000,
    defaultImage,
    true
  )
  return useImageSize({
    dispatch,
    id: userId,
    sizes: coverPhotoSizes,
    size,
    action: fetchCoverPhoto,
    defaultImage: profilePhoto
  })
}

export const useCoverPhoto = (
  userId: number | null,
  size: WidthSizes,
  defaultImage: string = imageCoverPhotoBlank as string,
  load = true
) => {
  const dispatch = useDispatch()
  const coverPhotoSizes = useSelector(
    (state) => getUser(state, { id: userId })?._cover_photo_sizes
  )
  const profilePhoto = useProfilePicture(
    userId,
    size === WidthSizes.SIZE_640
      ? SquareSizes.SIZE_480_BY_480
      : SquareSizes.SIZE_1000_BY_1000,
    defaultImage,
    load
  )
  return useImageSize({
    dispatch,
    id: userId,
    sizes: coverPhotoSizes ?? null,
    size,
    action: fetchCoverPhoto,
    defaultImage: profilePhoto,
    load
  })
}

/**
 * Like useUserProfilePicture, but onDemand is set to true, which
 * returns a callback that can be used to fetch the image on demand.
 */
export const useOnUserCoverPhoto = (
  userId: number | null,
  coverPhotoSizes: CoverPhotoSizes | null,
  size: WidthSizes,
  defaultImage: string = imageCoverPhotoBlank as string
) => {
  const dispatch = useDispatch()
  const profilePhoto = useProfilePicture(
    userId,
    size === WidthSizes.SIZE_640
      ? SquareSizes.SIZE_480_BY_480
      : SquareSizes.SIZE_1000_BY_1000,
    defaultImage,
    true
  )
  return useImageSize({
    dispatch,
    id: userId,
    sizes: coverPhotoSizes,
    size,
    action: fetchCoverPhoto,
    defaultImage: profilePhoto,
    onDemand: true
  })
}
