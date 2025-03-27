import { useUser } from '@audius/common/api'
import { useImageSize } from '@audius/common/hooks'
import type { SquareSizes, ID } from '@audius/common/models'
import { pick } from 'lodash'
import { Image } from 'react-native'

import { FastImage } from '@audius/harmony-native'
import type { FastImageProps } from '@audius/harmony-native'
import profilePicEmpty from 'app/assets/images/imageProfilePicEmpty2X.png'

import { primitiveToImageSource } from './primitiveToImageSource'

type UseUserImageOptions = {
  userId?: ID
  size: SquareSizes
}

export const useProfilePicture = ({
  userId,
  size
}: {
  userId?: ID
  size: SquareSizes
  defaultImage?: string
}) => {
  const { data: partialUser } = useUser(userId, {
    select: (user) => pick(user, 'profile_picture', 'updatedProfilePicture')
  })

  const { profile_picture, updatedProfilePicture } = partialUser ?? {}
  const image = useImageSize({
    artwork: profile_picture,
    targetSize: size,
    defaultImage: '',
    preloadImageFn: async (url: string) => {
      Image.prefetch(url)
    }
  })

  if (image === '') {
    return {
      source: profilePicEmpty,
      isFallbackImage: true
    }
  }

  if (updatedProfilePicture) {
    return {
      source: primitiveToImageSource(updatedProfilePicture.url),
      isFallbackImage: false
    }
  }

  return {
    source: primitiveToImageSource(image),
    isFallbackImage: false
  }
}

export type UserImageProps = UseUserImageOptions & Partial<FastImageProps>

export const UserImage = (props: UserImageProps) => {
  const { userId, size, ...imageProps } = props
  const { source } = useProfilePicture({ userId, size })

  return <FastImage {...imageProps} source={source ?? { uri: '' }} />
}
