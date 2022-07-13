import {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import useInstanceVar from 'audius-client/src/common/hooks/useInstanceVar'
import { Maybe } from 'audius-client/src/common/utils/typeUtils'
import {
  Animated,
  Image,
  ImageProps,
  ImageStyle,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native'

import { ImageSkeleton } from 'app/components/image-skeleton'
import { StylesProp } from 'app/styles'

export type DynamicImageProps = Omit<ImageProps, 'source'> & {
  // Image uri
  uri?: string
  styles?: StylesProp<{
    root: ViewStyle
    imageContainer: ViewStyle
    image: ImageStyle
  }>
  style?: StyleProp<ViewStyle>
  // Whether or not to immediately animate
  immediate?: boolean
  // overlays rendered above image
  children?: ReactNode
  // callback when image finishes loading
  onLoad?: () => void
  animatedValue?: Animated.Value
}

const styles = StyleSheet.create({
  imageContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  children: {
    position: 'relative',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

type ImageWithPlaceholderProps = {
  uri?: string
  style: StyleProp<ImageStyle>
}

const ImageWithPlaceholder = ({
  uri,
  style,
  ...other
}: ImageWithPlaceholderProps) => {
  if (uri) {
    return <Image source={{ uri }} style={style} {...other} />
  }

  return <ImageSkeleton styles={{ root: style as ViewStyle }} />
}

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

/**
 * A dynamic image that transitions between changes to the `uri` prop.
 */
export const DynamicImage = memo(function DynamicImage({
  uri,
  style,
  styles: stylesProp,
  immediate,
  children,
  onLoad,
  animatedValue,
  ...imageProps
}: DynamicImageProps) {
  const [firstSize, setFirstSize] = useState(0)
  const [secondSize, setSecondSize] = useState(0)
  const [firstImage, setFirstImage] = useState<string>()
  const [secondImage, setSecondImage] = useState<string>()

  const firstOpacity = useRef(new Animated.Value(0.5)).current
  const secondOpacity = useRef(new Animated.Value(0.5)).current

  const [isFirstImageActive, setIsFirstImageActive] = useState(true)

  const [getPrevImage, setPrevImage] = useInstanceVar<Maybe<string>>(undefined)

  const animateTo = useCallback(
    (anim: Animated.Value, toValue: number, callback?: () => void) =>
      Animated.timing(anim, {
        toValue,
        duration: immediate ? 100 : 500,
        useNativeDriver: true
      }).start(callback),
    [immediate]
  )

  useEffect(() => {
    // Skip animation for subsequent loads where the image hasn't changed
    const previousImage = getPrevImage()
    if (previousImage === uri) {
      return
    }

    setPrevImage(uri)

    if (isFirstImageActive) {
      setIsFirstImageActive(false)
      setFirstImage(uri)
      firstOpacity.setValue(1)
      animateTo(secondOpacity, 0, onLoad)
    } else {
      setIsFirstImageActive(true)
      setSecondImage(uri)
      secondOpacity.setValue(1)
      animateTo(firstOpacity, 0, onLoad)
    }
  }, [
    animateTo,
    firstOpacity,
    getPrevImage,
    uri,
    isFirstImageActive,
    secondOpacity,
    setIsFirstImageActive,
    setPrevImage,
    onLoad
  ])

  const handleSetFirstSize = useCallback((event: LayoutChangeEvent) => {
    setFirstSize(event.nativeEvent.layout.width)
  }, [])

  const handleSetSecondSize = useCallback((event: LayoutChangeEvent) => {
    setSecondSize(event.nativeEvent.layout.width)
  }, [])

  return (
    <Animated.View
      pointerEvents='none'
      style={[
        stylesProp?.root,
        style,
        animatedValue
          ? {
              transform: [
                {
                  scale: interpolateImageScale(animatedValue)
                },
                {
                  translateY: interpolateImageTranslate(animatedValue)
                }
              ]
            }
          : {}
      ]}>
      <Animated.View
        style={[
          stylesProp?.imageContainer,
          styles.imageContainer,
          { opacity: firstOpacity }
        ]}
        onLayout={handleSetFirstSize}>
        <ImageWithPlaceholder
          uri={firstImage}
          style={[{ width: firstSize, height: firstSize }, stylesProp?.image]}
          {...imageProps}
        />
      </Animated.View>
      <Animated.View
        style={[
          stylesProp?.imageContainer,
          styles.imageContainer,
          { opacity: secondOpacity, zIndex: isFirstImageActive ? -1 : 0 }
        ]}
        onLayout={handleSetSecondSize}>
        <ImageWithPlaceholder
          uri={secondImage}
          style={[{ width: secondSize, height: secondSize }, stylesProp?.image]}
          {...imageProps}
        />
      </Animated.View>
      {children ? <View style={styles.children}>{children}</View> : null}
    </Animated.View>
  )
})
