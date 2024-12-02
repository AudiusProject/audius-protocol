import type { ID } from '@audius/common/models'
import { SquareSizes, WidthSizes } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { BlurView } from '@react-native-community/blur'
import { Animated, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'

import type { FastImageProps } from '@audius/harmony-native'
import { FastImage } from '@audius/harmony-native'
import imageCoverPhotoBlank from 'app/assets/images/imageCoverPhotoBlank.jpg'
import type { ContentNodeImageSource } from 'app/hooks/useContentNodeImage'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'

import { useProfilePicture } from './UserImage'

const { getUser } = cacheUsersSelectors

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

const interpolateBlurViewOpacity = (scrollY: Animated.Value) =>
  scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1, 0],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  })

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

export const useCoverPhoto = (
  userId: Nullable<ID> = null,
  size: WidthSizes = WidthSizes.SIZE_640
): ContentNodeImageSource & { shouldBlur?: boolean } => {
  const cid = useSelector((state) => {
    const user = getUser(state, { id: userId })
    if (!user) return null
    const { cover_photo_sizes } = user
    return cover_photo_sizes
  })

  const cidMap = useSelector(
    (state) => getUser(state, { id: userId })?.cover_photo_cids
  )

  const updatedSource = useSelector((state) => {
    const user = getUser(state, { id: userId })
    if (!user) return null
    const { updatedProfilePicture } = user
    if (!updatedProfilePicture) return null
    return {
      source: { uri: updatedProfilePicture.url },
      handleError: () => {},
      isFallbackImage: false
    }
  })

  const coverPhotoSource = useContentNodeImage({
    cid,
    size,
    fallbackImageSource: imageCoverPhotoBlank,
    cidMap
  })

  const profilePictureSource = useProfilePicture(
    userId,
    size === WidthSizes.SIZE_640
      ? SquareSizes.SIZE_480_BY_480
      : SquareSizes.SIZE_1000_BY_1000
  )

  if (updatedSource) return updatedSource

  return coverPhotoSource.isFallbackImage &&
    !profilePictureSource.isFallbackImage
    ? { ...profilePictureSource, shouldBlur: true }
    : { ...coverPhotoSource, shouldBlur: false }
}

type CoverPhotoProps = {
  userId: ID
  animatedValue?: Animated.Value
} & Partial<FastImageProps>

export const CoverPhoto = (props: CoverPhotoProps) => {
  const { userId, animatedValue, ...imageProps } = props

  const { source, handleError, shouldBlur } = useCoverPhoto(userId)

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
      <FastImage source={source} onError={handleError} {...imageProps}>
        {shouldBlur || animatedValue ? (
          <AnimatedBlurView
            blurType='light'
            blurAmount={20}
            style={[
              { ...StyleSheet.absoluteFillObject, zIndex: 2 },
              animatedValue && !shouldBlur
                ? {
                    opacity: interpolateBlurViewOpacity(animatedValue)
                  }
                : undefined
            ]}
          />
        ) : null}
      </FastImage>
    </Animated.View>
  )
}
