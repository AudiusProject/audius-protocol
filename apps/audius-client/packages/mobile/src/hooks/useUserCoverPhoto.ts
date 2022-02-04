import imageCoverPhotoBlank from 'audius-client/src/common/assets/image/imageCoverPhotoBlank.jpg'
import { useImageSize } from 'audius-client/src/common/hooks/useImageSize'
import {
  CoverPhotoSizes,
  WidthSizes
} from 'audius-client/src/common/models/ImageSizes'
import { fetchCoverPhoto } from 'audius-client/src/common/store/cache/users/actions'
import { useDispatch } from 'react-redux'

import { useDispatchWeb } from './useDispatchWeb'

export const useUserCoverPhoto = (
  userId: number | null,
  coverPhotoSizes: CoverPhotoSizes | null,
  size: WidthSizes,
  defaultImage: string = imageCoverPhotoBlank as string,
  onDemand = false,
  load = true
) => {
  const dispatch = useDispatchWeb() as typeof useDispatch

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
