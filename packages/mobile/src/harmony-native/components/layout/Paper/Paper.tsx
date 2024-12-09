import { forwardRef } from 'react'

import { MobileOS } from '@audius/common/models'
import type { View } from 'react-native'
import { Platform, Pressable } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
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
    borderRadius = 'm',
    shadow = 'mid',
    style,
    onPress,
    ...other
  } = props

  const { shadows, motion, type } = useTheme()

  const pressed = useSharedValue(0)

  const shadowStyle = shadows[shadow]

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = withTiming(1, motion.press)
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, motion.press)
    })

  const interactiveStyles = useAnimatedStyle(
    () => ({
      shadowColor: interpolateColor(
        pressed.value,
        [0, 1],
        [shadowStyle.shadowColor, shadows.near.shadowColor]
      ),
      transform: [
        {
          scale: interpolate(pressed.value, [0, 1], [1, 0.995])
        }
      ],
      ...(Platform.OS === MobileOS.IOS && {
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
        }
      })
    }),
    [type]
  )

  const flexProps = { backgroundColor, borderRadius, shadow }

  if (!onPress) {
    return <Flex ref={ref} style={style} {...flexProps} {...other} />
  }

  return (
    <GestureDetector gesture={tap}>
      <Pressable onPress={onPress}>
        <AnimatedFlex
          ref={ref}
          style={[interactiveStyles, style]}
          {...flexProps}
          {...other}
        />
      </Pressable>
    </GestureDetector>
  )
})
