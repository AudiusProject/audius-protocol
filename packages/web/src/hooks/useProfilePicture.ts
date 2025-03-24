import { useUser } from '@audius/common/api'
import { imageProfilePicEmpty as profilePicEmpty } from '@audius/common/assets'
import { useImageSize } from '@audius/common/hooks'
import { SquareSizes, ID } from '@audius/common/models'

import { preload } from 'utils/image'

export const useProfilePicture = ({
  userId,
  size,
  defaultImage
}: {
  userId?: ID
  size: SquareSizes
  defaultImage?: string
}) => {
  const { data: user } = useUser(userId)

  const profilePicture = user?.profile_picture
  const image = useImageSize({
    artwork: profilePicture,
    targetSize: size,
    defaultImage: defaultImage ?? profilePicEmpty,
    preloadImageFn: preload
  })

  if (user?.updatedProfilePicture) {
    return user.updatedProfilePicture.url
  }
  return image
}
