import React, { memo, useCallback, useEffect, useRef, useState } from 'react'

import transparentPlaceholderImg from 'audius-client/src/common/assets/image/1x1-transparent.png'
import useInstanceVar from 'audius-client/src/common/hooks/useInstanceVar'
import {
  Animated,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { useThemeColors } from 'app/utils/theme'

export type DynamicImageProps = {
  // Image source
  image?: ImageSourcePropType
  // Style to apply to the image itself
  style?: StyleProp<ImageStyle>
  // Whether or not to immediately animate
  immediate?: boolean
  // Whether or not to use the default placeholder
  usePlaceholder?: boolean
}

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
})

const ImageWithPlaceholder = ({ usePlaceholder, image, style }) => {
  const { neutralLight8, neutralLight9 } = useThemeColors()

  if (image) {
    return <Image source={image} style={style} />
  }

  if (usePlaceholder) {
    return (
      <LinearGradient
        colors={[neutralLight8, neutralLight9]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={style}
      />
    )
  }

  return <Image source={transparentPlaceholderImg} />
}

/**
 * A dynamic image that transitions between changes to the `image` prop.
 */
const DynamicImage = ({
  image,
  style,
  immediate,
  usePlaceholder = true
}: DynamicImageProps) => {
  const [firstImage, setFirstImage] = useState<ImageSourcePropType>()
  const [secondImage, setSecondImage] = useState<ImageSourcePropType>()

  const firstOpacity = useRef(new Animated.Value(0)).current
  const secondOpacity = useRef(new Animated.Value(0)).current

  const [isFirstImageActive, setIsFirstImageActive] = useState(true)

  const [
    getPrevImage,
    setPrevImage
  ] = useInstanceVar<ImageSourcePropType | null>(null) // no previous image

  const animateTo = useCallback(
    (anim: Animated.Value, toValue: number) =>
      Animated.timing(anim, {
        toValue,
        duration: immediate ? 100 : 500,
        useNativeDriver: true
      }).start(),
    [immediate]
  )

  useEffect(() => {
    // Skip animation for subsequent loads where the image hasn't changed
    if (getPrevImage() !== null && getPrevImage() === image) {
      return
    }

    setPrevImage(image ?? null)

    if (isFirstImageActive) {
      setIsFirstImageActive(false)
      setFirstImage(image)
      animateTo(firstOpacity, 1)
      animateTo(secondOpacity, 0)
    } else {
      setIsFirstImageActive(true)
      setSecondImage(image)
      animateTo(firstOpacity, 0)
      animateTo(secondOpacity, 1)
    }
  }, [
    animateTo,
    firstOpacity,
    getPrevImage,
    image,
    isFirstImageActive,
    secondOpacity,
    setIsFirstImageActive,
    setPrevImage
  ])

  return (
    <View>
      <Animated.View style={[styles.image, { opacity: firstOpacity }]}>
        <ImageWithPlaceholder
          image={firstImage}
          style={style}
          usePlaceholder={usePlaceholder}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.image,
          { opacity: secondOpacity, zIndex: isFirstImageActive ? -1 : 0 }
        ]}
      >
        <ImageWithPlaceholder
          image={secondImage}
          style={style}
          usePlaceholder={usePlaceholder}
        />
      </Animated.View>
    </View>
  )
}

export default memo(DynamicImage)
