import type { WidthSizes } from '@audius/common'
import { cacheUsersActions } from '@audius/common'

import imageCoverPhotoBlank from 'app/assets/images/imageCoverPhotoBlank.jpg'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'
const { fetchCoverPhoto } = cacheUsersActions

export const useUserCoverPhoto = getUseImageSizeHook<WidthSizes>({
  defaultImageSource: imageCoverPhotoBlank,
  action: fetchCoverPhoto
})
