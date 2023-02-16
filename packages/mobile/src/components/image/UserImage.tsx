import type { Nullable, SquareSizes, User } from '@audius/common'

import profilePicEmpty from 'app/assets/images/imageProfilePicEmpty2X.png'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'

import type { FastImageProps } from './FastImage'
import { FastImage } from './FastImage'

type UseUserImageOptions = {
  user: Nullable<
    Pick<
      User,
      'profile_picture_sizes' | 'profile_picture' | 'creator_node_endpoint'
    >
  >
  size: SquareSizes
}

export const useUserImage = ({ user, size }: UseUserImageOptions) => {
  const cid = user ? user.profile_picture_sizes || user.profile_picture : null

  return useContentNodeImage({
    cid,
    size,
    user,
    fallbackImageSource: profilePicEmpty
  })
}

export type UserImageProps = UseUserImageOptions & Partial<FastImageProps>

export const UserImage = (props: UserImageProps) => {
  const { user, size, ...imageProps } = props
  const { source, handleError } = useUserImage({ user, size })

  return <FastImage {...imageProps} source={source} onError={handleError} />
}
