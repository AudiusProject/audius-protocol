import { useEffect } from 'react'

import { useTheme } from '@emotion/react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated'

import { Box } from './layout/Box/Box'
import type { BoxProps } from './layout/Box/types'

const AnimatedBox = Animated.createAnimatedComponent(Box)

type SkeletonProps = BoxProps

export const Skeleton = (props: SkeletonProps) => {
  const { color } = useTheme()
  const color1 = color.neutral.n50
  const color2 = color.neutral.n100

  // Create shared value for shimmer animation
  const shimmerPosition = useSharedValue(0)

  // Setup animation loop
  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1500,
          easing: Easing.linear
        }),
        withTiming(0, {
          duration: 0
        })
      ),
      -1 // Infinite repeat
    )
  }, [shimmerPosition])

  // Create animated styles for the shimmer effect
  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: shimmerPosition.value * -200 + 100 // Move from right to left
        }
      ]
    }
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
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: color2,
            opacity: 0.5
          },
          shimmerStyle
        ]}
      />
    </AnimatedBox>
  )
}
