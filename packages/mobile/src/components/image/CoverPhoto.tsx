import { useImageSize } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { SquareSizes, WidthSizes } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { BlurView } from '@react-native-community/blur'
import { Animated, StyleSheet } from 'react-native'
import { useSelector } from 'react-redux'

import type { FastImageProps } from '@audius/harmony-native'
import { FastImage, preload } from '@audius/harmony-native'

import { useProfilePicture } from './UserImage'
import { primitiveToImageSource } from './primitiveToImageSource'

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

export const useCoverPhoto = ({
  userId,
  size
}: {
  userId?: ID
  size: WidthSizes
}) => {
  const { source: profilePicture, isFallbackImage: isDefaultProfile } =
    useProfilePicture({
      userId,
      size:
        size === WidthSizes.SIZE_640
          ? SquareSizes.SIZE_480_BY_480
          : SquareSizes.SIZE_1000_BY_1000,
      defaultImage: ''
    })
  const user = useSelector((state) => getUser(state, { id: userId }))
  const coverPhoto = user?.cover_photo
  const image = useImageSize({
    artwork: coverPhoto,
    targetSize: size,
    defaultImage: '',
    preloadImageFn: async (url: string) => {
      preload([{ uri: url }])
    }
  })

  const isDefaultCover = image === ''
  const shouldBlur = isDefaultCover && !isDefaultProfile

  if (user?.updatedCoverPhoto && !shouldBlur) {
    return {
      source: primitiveToImageSource(user.updatedCoverPhoto.url),
      shouldBlur
    }
  }

  if (shouldBlur) {
    return { source: profilePicture, shouldBlur }
  }
  return { source: primitiveToImageSource(image), shouldBlur }
}

type CoverPhotoProps = {
  userId: ID
  animatedValue?: Animated.Value
} & Partial<FastImageProps>

export const CoverPhoto = (props: CoverPhotoProps) => {
  const { userId, animatedValue, ...imageProps } = props

  const { source, shouldBlur } = useCoverPhoto({
    userId,
    size: WidthSizes.SIZE_640
  })

  if (!source) return null

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
      <FastImage source={source} {...imageProps}>
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
