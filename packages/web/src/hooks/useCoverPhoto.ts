import { useCallback } from 'react'

import {
  CoverPhotoSizes,
  WidthSizes,
  cacheUsersActions,
  imageCoverPhotoBlank,
  cacheUsersSelectors,
  SquareSizes,
  imageProfilePicEmpty
} from '@audius/common'
import { useImageSize } from '@audius/common/hooks'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

import {
  useOnUserProfilePicture,
  useProfilePicture
} from './useUserProfilePicture'

const { fetchCoverPhoto } = cacheUsersActions
const { getUser } = cacheUsersSelectors

export const useCoverPhoto = (
  userId: number | null,
  size: WidthSizes,
  defaultImage: string = imageCoverPhotoBlank as string,
  load = true,
  debug = false
) => {
  const dispatch = useDispatch()
  const coverPhotoSizes = useSelector((state) => {
    const user = getUser(state, { id: userId })
    return user?.is_deactivated ? null : user?._cover_photo_sizes
  })
  const profilePhoto = useProfilePicture(
    userId,
    size === WidthSizes.SIZE_640
      ? SquareSizes.SIZE_480_BY_480
      : SquareSizes.SIZE_1000_BY_1000,
    imageProfilePicEmpty,
    load
  )

  const coverPhoto = useImageSize({
    dispatch,
    id: userId,
    sizes: coverPhotoSizes ?? null,
    size,
    action: fetchCoverPhoto,
    defaultImage: imageCoverPhotoBlank,
    load
  })

  const isDefaultCover = coverPhoto === imageCoverPhotoBlank
  const isDefaultProfile = profilePhoto === imageProfilePicEmpty

  return {
    source: !isDefaultCover
      ? coverPhoto
      : !isDefaultProfile
      ? profilePhoto
      : defaultImage,
    shouldBlur: isDefaultCover && !isDefaultProfile,
    debug
  }
}

// TODO: this is only used once, maybe just do it inline
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
  const profilePictureSizes = useSelector(
    (state) => getUser(state, { id: userId })?._profile_picture_sizes
  )
  const getProfilePhoto = useOnUserProfilePicture(
    userId,
    profilePictureSizes ?? null,
    size === WidthSizes.SIZE_640
      ? SquareSizes.SIZE_480_BY_480
      : SquareSizes.SIZE_1000_BY_1000,
    ''
  )

  const getCoverPhoto = useImageSize({
    dispatch,
    id: userId,
    sizes: coverPhotoSizes ?? null,
    size,
    action: fetchCoverPhoto,
    defaultImage: '',
    load: true,
    onDemand: true
  })

  return useCallback(() => {
    const coverPhoto = getCoverPhoto()
    const profilePhoto = getProfilePhoto()
    const isDefaultCover = coverPhoto === imageCoverPhotoBlank
    const isDefaultProfile = profilePhoto === imageProfilePicEmpty

    return {
      source: !isDefaultCover
        ? coverPhoto
        : !isDefaultProfile
        ? profilePhoto
        : defaultImage,
      shouldBlur: isDefaultCover && !isDefaultProfile
    }
  }, [defaultImage, getCoverPhoto, getProfilePhoto])
}
