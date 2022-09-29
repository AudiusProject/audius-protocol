import {
  CoverPhotoSizes,
  WidthSizes,
  useImageSize,
  cacheUsersActions,
  imageCoverPhotoBlank
} from '@audius/common'
import { useDispatch } from 'react-redux'

const { fetchCoverPhoto } = cacheUsersActions

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
