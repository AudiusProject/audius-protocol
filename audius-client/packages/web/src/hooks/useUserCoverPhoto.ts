import { CoverPhotoSizes, WidthSizes } from '@audius/common'
import { useDispatch } from 'react-redux'

import imageCoverPhotoBlank from 'assets/img/imageCoverPhotoBlank.jpg'
import { useImageSize } from 'common/hooks/useImageSize'
import { fetchCoverPhoto } from 'common/store/cache/users/actions'

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
