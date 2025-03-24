import { useUser } from '@audius/common/api'
import {
  imageCoverPhotoBlank,
  imageProfilePicEmpty
} from '@audius/common/assets'
import { useImageSize } from '@audius/common/hooks'
import { SquareSizes, WidthSizes, ID } from '@audius/common/models'

import { preload } from 'utils/image'

import { useProfilePicture } from './useProfilePicture'

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
  const { data: user } = useUser(userId)
  const coverPhoto = user?.cover_photo
  const image = useImageSize({
    artwork: coverPhoto,
    targetSize: size,
    defaultImage: defaultImage ?? imageCoverPhotoBlank,
    preloadImageFn: preload
  })

  const isDefaultCover = image === imageCoverPhotoBlank
  const isDefaultProfile = profilePicture === imageProfilePicEmpty
  const shouldBlur = isDefaultCover && !isDefaultProfile

  if (user?.updatedCoverPhoto && !shouldBlur) {
    return { image: user.updatedCoverPhoto.url, shouldBlur }
  }

  return { image: shouldBlur ? profilePicture : image, shouldBlur }
}
