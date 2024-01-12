import { useCallback, useState } from 'react'

import { css } from '@emotion/native'
import { useLinkProps } from '@react-navigation/native'
import { Pressable, type GestureResponderEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { useTheme } from '../../foundations/theme/useTheme'
import { Text } from '../Text/Text'

import type { TextLinkProps } from './types'

const AnimatedText = Animated.createAnimatedComponent(Text)

export const TextLink = <ParamList extends ReactNavigation.RootParamList>(
  props: TextLinkProps<ParamList>
) => {
  const {
    to,
    action,
    children,
    variant = 'default',
    // TODO: Add external link support
    // isExternal = false,
    onPress,
    textVariant,
    showUnderline,
    ...other
  } = props
  const { onPress: onPressLink, ...linkProps } = useLinkProps({ to, action })
  const { color, motion } = useTheme()
  const [isPressing, setIsPressing] = useState(showUnderline)
  const pressed = useSharedValue(0)

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress?.(e)
      onPressLink(e)
      pressed.value = withTiming(0, motion.press)
    },
    [motion.press, onPress, onPressLink, pressed]
  )

  const variantColors = {
    default: color.link.default,
    subdued: color.link.subdued,
    visible: color.link.visible,
    inverted: color.static.white
  }

  const variantPressingColors = {
    default: color.primary.p300,
    subdued: color.primary.p300,
    visible: color.link.visible,
    inverted: color.static.white
  }

  const tap = Gesture.Tap().onBegin(() => {
    pressed.value = withTiming(1, motion.press)
  })

  const animatedLinkStyles = useAnimatedStyle(() => ({
    color: interpolateColor(
      pressed.value,
      [0, 1],
      [variantColors[variant], variantPressingColors[variant]]
    )
  }))

  return (
    <GestureDetector gesture={tap}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => setIsPressing(true)}
        onPressOut={() => setIsPressing(false)}
      >
        <AnimatedText
          style={[
            animatedLinkStyles,
            css({
              textDecorationLine:
                isPressing || showUnderline ? 'underline' : 'none'
            })
          ]}
          variant={textVariant}
          {...other}
          {...linkProps}
        >
          {children}
        </AnimatedText>
      </Pressable>
    </GestureDetector>
  )
}
