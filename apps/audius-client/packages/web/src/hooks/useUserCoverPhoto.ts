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
  defaultImage: string = imageCoverPhotoBlank as string,
  onDemand = false,
  load = true
) => {
  const dispatch = useDispatch()

  return useImageSize({
    dispatch,
    id: userId,
    sizes: coverPhotoSizes,
    size,
    action: fetchCoverPhoto,
    defaultImage,
    onDemand,
    load
  })
}
