import {
  CoverPhotoSizes,
  WidthSizes,
  useImageSize,
  cacheUsersActions,
  imageCoverPhotoBlank,
  cacheUsersSelectors
} from '@audius/common'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

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

  return useImageSize({
    dispatch,
    id: userId,
    sizes: coverPhotoSizes,
    size,
    action: fetchCoverPhoto,
    defaultImage
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
  return useImageSize({
    dispatch,
    id: userId,
    sizes: coverPhotoSizes ?? null,
    size,
    action: fetchCoverPhoto,
    defaultImage,
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

  return useImageSize({
    dispatch,
    id: userId,
    sizes: coverPhotoSizes,
    size,
    action: fetchCoverPhoto,
    defaultImage,
    onDemand: true
  })
}
