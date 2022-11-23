import type { Nullable, User } from '@audius/common'
import { WidthSizes } from '@audius/common'

import imageCoverPhotoBlank from 'app/assets/images/imageCoverPhotoBlank.jpg'
import type { DynamicImageProps } from 'app/components/core'
import { DynamicImage } from 'app/components/core'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'

export const useUserCoverImage = (
  user: Nullable<
    Pick<User, 'cover_photo_sizes' | 'cover_photo' | 'creator_node_endpoint'>
  >
) => {
  const cid = user ? user.cover_photo_sizes || user.cover_photo : null

  return useContentNodeImage({
    cid,
    user,
    sizes: WidthSizes,
    fallbackImageSource: imageCoverPhotoBlank
  })
}

type UserCoverImageProps = {
  user: Parameters<typeof useUserCoverImage>[0]
} & DynamicImageProps

export const UserCoverImage = (props: UserCoverImageProps) => {
  const { user, ...imageProps } = props

  const { source, handleError } = useUserCoverImage(user)

  return <DynamicImage {...imageProps} source={source} onError={handleError} />
}
