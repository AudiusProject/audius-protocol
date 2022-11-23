import type { Nullable, User } from '@audius/common'

import profilePicEmpty from 'app/assets/images/imageProfilePicEmpty2X.png'
import type { DynamicImageProps } from 'app/components/core'
import { DynamicImage } from 'app/components/core'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'

export const useUserImage = (
  user: Nullable<
    Pick<
      User,
      'profile_picture_sizes' | 'profile_picture' | 'creator_node_endpoint'
    >
  >
) => {
  const cid = user ? user.profile_picture_sizes || user.profile_picture : null

  return useContentNodeImage({
    cid,
    user,
    fallbackImageSource: profilePicEmpty
  })
}

export type UserImageProps = {
  user: Parameters<typeof useUserImage>[0]
} & DynamicImageProps

export const UserImage = (props: UserImageProps) => {
  const { user, ...imageProps } = props
  const { source, handleError } = useUserImage(user)

  return <DynamicImage {...imageProps} source={source} onError={handleError} />
}
