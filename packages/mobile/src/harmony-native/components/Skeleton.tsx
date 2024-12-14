import { useEffect, useRef } from 'react'

import { useTheme } from '@emotion/react'
import { Animated } from 'react-native'

import { Box } from './layout/Box/Box'
import type { BoxProps } from './layout/Box/types'

const AnimatedBox = Animated.createAnimatedComponent(Box)

type SkeletonProps = BoxProps

export const Skeleton = (props: SkeletonProps) => {
  const { color } = useTheme()
  const color1 = color.neutral.n50
  const color2 = color.neutral.n100

  // Create animated value for shimmer effect
  const shimmerAnimation = useRef(new Animated.Value(0)).current

  // Setup animation loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true
        })
      ])
    )
    loop.start()

    return () => {
      loop.stop()
    }
  }, [shimmerAnimation])

  // Create interpolated values for the gradient positions
  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [100, -100] // Move gradient from right to left
  })

  return (
    <AnimatedBox
      {...props}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: color1,
          overflow: 'hidden'
        },
        props.style
      ]}
    >
      <AnimatedBox
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
          backgroundColor: color2,
          opacity: 0.5
        }}
      />
    </AnimatedBox>
  )
}
