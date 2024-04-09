import { forwardRef } from 'react'

import { css } from '@emotion/native'
import type { View } from 'react-native'
import { Animated, Pressable } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { useTheme } from '../../../foundations/theme'
import { Flex } from '../Flex/Flex'

import type { PaperProps } from './types'

const AnimatedFlex = Animated.createAnimatedComponent(Flex)

/**
 * Base layout component used as a building block for creating pages
 * and other components.
 * */
export const Paper = forwardRef<View, PaperProps>((props, ref) => {
  const {
    backgroundColor = 'white',
    border,
    borderRadius = 'm',
    shadow = 'mid',
    style,
    ...other
  } = props

  const { onPress } = other
  const { color, shadows, cornerRadius, motion } = useTheme()

  const pressed = useSharedValue(0)

  const shadowStyle = shadows[shadow]

  const rootStyle = css({
    ...shadowStyle,
    ...(border && {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: color.border[border]
    }),
    borderRadius: cornerRadius[borderRadius],
    backgroundColor: color.background[backgroundColor]
  })

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = withTiming(1, motion.press)
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, motion.press)
    })

  const interactiveStyles = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(
      pressed.value,
      [0, 1],
      [shadowStyle.shadowOpacity, shadows.near.shadowOpacity]
    ),
    shadowRadius: interpolate(
      pressed.value,
      [0, 1],
      [shadowStyle.shadowRadius, shadows.near.shadowRadius]
    ),
    shadowOffset: {
      width: interpolate(
        pressed.value,
        [0, 1],
        [shadowStyle.shadowOffset.width, shadows.near.shadowOffset.width]
      ),
      height: interpolate(
        pressed.value,
        [0, 1],
        [shadowStyle.shadowOffset.height, shadows.near.shadowOffset.height]
      )
    },
    shadowColor: interpolateColor(
      pressed.value,
      [0, 1],
      [shadowStyle.shadowColor, shadows.near.shadowColor]
    ),
    transform: [
      {
        scale: interpolate(pressed.value, [0, 1], [1, 0.95])
      }
    ]
  }))

  if (!onPress) {
    return <Flex ref={ref} style={[rootStyle, style]} {...other} />
  }

  return (
    <GestureDetector gesture={tap}>
      <Pressable onPress={onPress}>
        <AnimatedFlex
          ref={ref}
          style={[rootStyle, interactiveStyles, style]}
          {...other}
        />
      </Pressable>
    </GestureDetector>
  )
})
