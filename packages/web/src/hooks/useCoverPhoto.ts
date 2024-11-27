import {
  imageCoverPhotoBlank,
  imageProfilePicEmpty
} from '@audius/common/assets'
import { useImageSize2 } from '@audius/common/hooks'
import { SquareSizes, WidthSizes, ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'

import { preload } from 'utils/image'
import { useSelector } from 'utils/reducer'

import { useProfilePicture } from './useUserProfilePicture'

const { getUser } = cacheUsersSelectors

export const useCoverPhoto = ({
  userId,
  size,
  defaultImage
}: {
  userId?: ID
  size: WidthSizes
  defaultImage?: string
}) => {
  const profilePicture = useProfilePicture({
    userId,
    size:
      size === WidthSizes.SIZE_640
        ? SquareSizes.SIZE_480_BY_480
        : SquareSizes.SIZE_1000_BY_1000,
    defaultImage: imageProfilePicEmpty
  })
  const artwork = useSelector(
    (state) => getUser(state, { id: userId })?.cover_photo
  )
  const coverPhoto = useImageSize2({
    artwork,
    targetSize: size,
    defaultImage: defaultImage ?? imageCoverPhotoBlank,
    preloadImageFn: preload
  })

  const isDefaultCover = coverPhoto === imageCoverPhotoBlank
  const isDefaultProfile = profilePicture === imageProfilePicEmpty

  if (isDefaultCover && !isDefaultProfile) {
    return profilePicture
  }
  return coverPhoto
}
