import type { Nullable, User } from '@audius/common'
import { WidthSizes } from '@audius/common'
import { Animated } from 'react-native'

import imageCoverPhotoBlank from 'app/assets/images/imageCoverPhotoBlank.jpg'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'

import type { FastImageProps } from './FastImage'
import { FastImage } from './FastImage'

const interpolateImageScale = (animatedValue: Animated.Value) =>
  animatedValue.interpolate({
    inputRange: [-200, 0],
    outputRange: [4, 1],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  })

const interpolateImageTranslate = (animatedValue: Animated.Value) =>
  animatedValue.interpolate({
    inputRange: [-200, 0],
    outputRange: [-40, 0],
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

type CoverImageUser = Nullable<
  Pick<
    User,
    | 'cover_photo_sizes'
    | 'cover_photo_cids'
    | 'cover_photo'
    | 'updatedCoverPhoto'
  >
>

export const useUserCoverImage = (user: CoverImageUser) => {
  const cid = user ? user.cover_photo_sizes || user.cover_photo : null

  const contentNodeImage = useContentNodeImage({
    cid,
    size: WidthSizes.SIZE_640,
    fallbackImageSource: imageCoverPhotoBlank,
    cidMap: user?.cover_photo_cids
  })

  if (user?.updatedCoverPhoto) {
    return {
      source: { uri: user.updatedCoverPhoto.url },
      handleError: () => {}
    }
  }

  return contentNodeImage
}

type UserCoverImageProps = {
  user: CoverImageUser
  animatedValue?: Animated.Value
} & Partial<FastImageProps>

export const UserCoverImage = (props: UserCoverImageProps) => {
  const { user, animatedValue, ...imageProps } = props

  const { source, handleError } = useUserCoverImage(user)

  return (
    <Animated.View
      style={
        animatedValue && {
          transform: [
            { scale: interpolateImageScale(animatedValue) },
            { translateY: interpolateImageTranslate(animatedValue) }
          ]
        }
      }
    >
      <FastImage source={source} onError={handleError} {...imageProps} />
    </Animated.View>
  )
}
