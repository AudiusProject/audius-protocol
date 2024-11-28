import { imageProfilePicEmpty as profilePicEmpty } from '@audius/common/assets'
import { useImageSize2 } from '@audius/common/hooks'
import { SquareSizes, ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'

import { preload } from 'utils/image'
import { useSelector } from 'utils/reducer'

const { getUser } = cacheUsersSelectors

export const useProfilePicture = ({
  userId,
  size,
  defaultImage
}: {
  userId?: ID
  size: SquareSizes
  defaultImage?: string
}) => {
  const user = useSelector((state) => getUser(state, { id: userId }))

  const profilePicture = user?.profile_picture
  const image = useImageSize2({
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
