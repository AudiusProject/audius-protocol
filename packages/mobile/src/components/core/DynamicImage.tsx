import type { ReactNode } from 'react'
import { useEffect, memo, useCallback, useRef, useState } from 'react'

import { useInstanceVar } from '@audius/common/hooks'
import type { Maybe } from '@audius/common/utils'
import type {
  ImageProps,
  ImageSourcePropType,
  ImageStyle,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle
} from 'react-native'
import { Animated, Image, StyleSheet, View } from 'react-native'

import Skeleton from 'app/components/skeleton'
import type { StylesProp } from 'app/styles'

export type DynamicImageProps = Omit<ImageProps, 'source'> & {
  source?: ImageSourcePropType
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
  firstOpacity?: number
  noSkeleton?: boolean
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

/*
 * Displays a skeleton while loading an image
 * then fades in the image
 */
const ImageLoader = ({
  source,
  style,
  styles: stylesProp,
  immediate,
  children,
  onLoad,
  animatedValue,
  noSkeleton,
  ...imageProps
}: DynamicImageProps) => {
  const [size, setSize] = useState(0)
  const skeletonOpacity = useRef(new Animated.Value(1)).current
  const [isAnimationFinished, setIsAnimationFinished] = useState(false)

  const handleSetSize = useCallback((event: LayoutChangeEvent) => {
    setSize(event.nativeEvent.layout.width)
  }, [])

  const handleLoad = useCallback(() => {
    Animated.timing(skeletonOpacity, {
      toValue: 0,
      duration: immediate ? 100 : 500,
      useNativeDriver: true
    }).start(() => {
      onLoad?.()
      setIsAnimationFinished(true)
    })
  }, [skeletonOpacity, onLoad, immediate])

  useEffect(() => {
    // Reset the animation when the source changes
    if (source) {
      setIsAnimationFinished(false)
      skeletonOpacity.setValue(1)
    }
  }, [source, skeletonOpacity])

  return (
    <View onLayout={handleSetSize}>
      {source ? (
        <Image
          source={source}
          style={[{ width: size, height: size }, stylesProp?.image]}
          {...imageProps}
          onLoad={handleLoad}
        />
      ) : null}
      {!isAnimationFinished && !noSkeleton ? (
        <Animated.View
          style={[
            stylesProp?.imageContainer,
            styles.imageContainer,
            { opacity: skeletonOpacity }
          ]}
        >
          <Skeleton
            width={size}
            height={size}
            style={[{ width: size, height: size }, stylesProp?.image]}
          />
        </Animated.View>
      ) : null}
      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  )
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
 * A dynamic image that transitions between changes to the `source` prop.
 */
export const DynamicImage = memo(function DynamicImage({
  source,
  style,
  styles: stylesProp,
  immediate,
  children,
  onLoad,
  animatedValue,
  ...imageProps
}: DynamicImageProps) {
  const [firstImage, setFirstImage] =
    useState<Maybe<ImageSourcePropType>>(source)
  const [secondImage, setSecondImage] = useState<Maybe<ImageSourcePropType>>()

  const firstOpacity = useRef(new Animated.Value(1)).current
  const secondOpacity = useRef(new Animated.Value(0)).current

  const [isFirstImageActive, setIsFirstImageActive] = useState(true)

  const [getPrevImage, setPrevImage] =
    useInstanceVar<Maybe<ImageSourcePropType>>(source)

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
    if (previousImage === source) {
      return
    }

    setPrevImage(source)

    if (isFirstImageActive) {
      setIsFirstImageActive(false)
      setSecondImage(source)
      animateTo(secondOpacity, 1, () => {
        onLoad?.()
        firstOpacity.setValue(0)
        setFirstImage(undefined)
      })
    } else {
      setIsFirstImageActive(true)
      setFirstImage(source)
      firstOpacity.setValue(1)
      animateTo(secondOpacity, 0, () => {
        onLoad?.()
        setSecondImage(undefined)
      })
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
    onLoad,
    firstImage,
    secondImage
  ])

  return (
    <Animated.View
      pointerEvents={children ? undefined : 'none'}
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
      ]}
    >
      <Animated.View
        style={[
          stylesProp?.imageContainer,
          styles.imageContainer,
          { opacity: firstOpacity }
        ]}
      >
        <ImageLoader source={firstImage} styles={stylesProp} {...imageProps} />
      </Animated.View>
      {secondImage ? (
        <Animated.View
          style={[
            stylesProp?.imageContainer,
            styles.imageContainer,
            { opacity: secondOpacity }
          ]}
        >
          <ImageLoader
            source={secondImage}
            styles={stylesProp}
            {...imageProps}
          />
        </Animated.View>
      ) : null}
      {children ? <View style={styles.children}>{children}</View> : null}
    </Animated.View>
  )
})
