import type { SquareSizes } from '@audius/common'
import { cacheUsersActions } from '@audius/common'

import profilePicEmpty from 'app/assets/images/imageProfilePicEmpty2X.png'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'
const { fetchProfilePicture } = cacheUsersActions

export const useUserProfilePicture = getUseImageSizeHook<SquareSizes>({
  defaultImageSource: profilePicEmpty,
  action: fetchProfilePicture
})
