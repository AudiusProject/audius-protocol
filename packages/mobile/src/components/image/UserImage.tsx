import { useImageSize2 } from '@audius/common/hooks'
import type { SquareSizes, ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { Image } from 'react-native'
import { useSelector } from 'react-redux'

import { FastImage } from '@audius/harmony-native'
import type { FastImageProps } from '@audius/harmony-native'
import profilePicEmpty from 'app/assets/images/imageProfilePicEmpty2X.png'

import { primitiveToImageSource } from './primitiveToImageSource'

const { getUser } = cacheUsersSelectors

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
  const user = useSelector((state) => getUser(state, { id: userId }))

  const profilePicture = user?.profile_picture
  const image = useImageSize2({
    artwork: profilePicture,
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

  if (user?.updatedProfilePicture) {
    return {
      source: primitiveToImageSource(user.updatedProfilePicture.url),
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

  if (!source) return null

  return <FastImage {...imageProps} source={source} />
}
