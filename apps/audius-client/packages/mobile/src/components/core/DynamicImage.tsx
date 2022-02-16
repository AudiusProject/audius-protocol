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
import { isArray, isObject } from 'lodash'
import {
  Animated,
  Image,
  ImageSourcePropType,
  ImageStyle,
  ImageURISource,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native'

import transparentPlaceholderImg from 'app/assets/images/1x1-transparent.png'
import { ImageSkeleton } from 'app/components/image-skeleton'
import { StylesProp } from 'app/styles'

export type DynamicImageProps = {
  // Image source
  source?: ImageSourcePropType
  styles?: StylesProp<{
    root: ViewStyle
    imageContainer: ViewStyle
    image: ImageStyle
  }>
  style?: StyleProp<ViewStyle>
  // Whether or not to immediately animate
  immediate?: boolean
  // Whether or not to use the default placeholder
  usePlaceholder?: boolean
  // overlays rendered above image
  children?: ReactNode
  // callback when image finishes loading
  onLoad?: () => void
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

const isImageEqual = (
  imageA: Maybe<ImageSourcePropType>,
  imageB: Maybe<ImageSourcePropType>
) => {
  if (imageA === imageB) {
    return true
  }

  if (
    isArray(imageA) &&
    isArray(imageB) &&
    !imageA.some((v, i) => v.uri !== imageB[i].uri)
  ) {
    return true
  }

  if (
    isObject(imageA) &&
    isObject(imageB) &&
    (imageA as ImageURISource).uri === (imageB as ImageURISource).uri
  ) {
    return true
  }

  return false
}

type ImageWithPlaceholderProps = {
  usePlaceholder: boolean
  source?: ImageSourcePropType
  style: StyleProp<ImageStyle>
}

const ImageWithPlaceholder = ({
  usePlaceholder,
  source,
  style
}: ImageWithPlaceholderProps) => {
  if (source) {
    return <Image source={source} style={style} />
  }

  if (usePlaceholder) {
    return <ImageSkeleton styles={{ root: style as ViewStyle }} />
  }

  return <Image source={transparentPlaceholderImg} style={style} />
}

/**
 * A dynamic image that transitions between changes to the `image` prop.
 */
export const DynamicImage = memo(function DynamicImage({
  source,
  style,
  styles: stylesProp,
  immediate,
  usePlaceholder = true,
  children,
  onLoad
}: DynamicImageProps) {
  const [firstSize, setFirstSize] = useState(0)
  const [secondSize, setSecondSize] = useState(0)
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
    if (previousImage !== null && isImageEqual(previousImage, source)) {
      return
    }

    setPrevImage(source ?? null)

    if (isFirstImageActive) {
      setIsFirstImageActive(false)
      setFirstImage(source)
      animateTo(firstOpacity, 1, onLoad)
      animateTo(secondOpacity, 0)
    } else {
      setIsFirstImageActive(true)
      setSecondImage(source)
      animateTo(firstOpacity, 0)
      animateTo(secondOpacity, 1, onLoad)
    }
  }, [
    animateTo,
    firstOpacity,
    getPrevImage,
    source,
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
    <View style={[style, stylesProp?.root]}>
      <Animated.View
        style={[
          stylesProp?.imageContainer,
          styles.imageContainer,
          { opacity: firstOpacity }
        ]}
        onLayout={handleSetFirstSize}
      >
        <ImageWithPlaceholder
          source={firstImage}
          style={[{ width: firstSize, height: firstSize }, stylesProp?.image]}
          usePlaceholder={usePlaceholder}
        />
      </Animated.View>
      <Animated.View
        style={[
          stylesProp?.imageContainer,
          styles.imageContainer,
          { opacity: secondOpacity, zIndex: isFirstImageActive ? -1 : 0 }
        ]}
        onLayout={handleSetSecondSize}
      >
        <ImageWithPlaceholder
          source={secondImage}
          style={[{ width: secondSize, height: secondSize }, stylesProp?.image]}
          usePlaceholder={usePlaceholder}
        />
      </Animated.View>
      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  )
})
