import { useUser } from '@audius/common/api'
import { imageProfilePicEmpty as profilePicEmpty } from '@audius/common/assets'
import { useImageSize } from '@audius/common/hooks'
import { SquareSizes, ID } from '@audius/common/models'
import { pick } from 'lodash'

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
  const { data: partialUser } = useUser(userId, {
    select: (user) => pick(user, 'profile_picture', 'updatedProfilePicture')
  })
  const { profile_picture, updatedProfilePicture } = partialUser ?? {}

  const { imageUrl } = useImageSize({
    artwork: profile_picture,
    targetSize: size,
    defaultImage: defaultImage ?? profilePicEmpty,
    preloadImageFn: preload
  })

  if (updatedProfilePicture) {
    return updatedProfilePicture.url
  }
  return imageUrl
}
