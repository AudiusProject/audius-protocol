import { useCallback, useState } from 'react'

import { css } from '@emotion/native'
import {
  type GestureResponderEvent,
  TouchableWithoutFeedback
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { useTheme } from '../../foundations/theme/useTheme'
import { Text } from '../Text/Text'

import { ExternalLink } from './ExternalLink'
import { InternalLink } from './InternalLink'
import type { TextLinkProps } from './types'

const AnimatedText = Animated.createAnimatedComponent(Text)

export const TextLink = <ParamList extends ReactNavigation.RootParamList>(
  props: TextLinkProps<ParamList>
) => {
  const {
    children,
    variant = 'default',
    onPress,
    textVariant,
    showUnderline,
    ...other
  } = props
  const { color, motion } = useTheme()
  const [isPressing, setIsPressing] = useState(showUnderline)
  const pressed = useSharedValue(0)

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress?.(e)
      pressed.value = withTiming(0, motion.press)
    },
    [motion.press, onPress, pressed]
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

  let element = (
    <AnimatedText
      style={[
        animatedLinkStyles,
        css({
          textDecorationLine: isPressing || showUnderline ? 'underline' : 'none'
        })
      ]}
      variant={textVariant}
      {...other}
    >
      {children}
    </AnimatedText>
  )

  const rootProps = {
    onPress: handlePress,
    onPressIn: () => setIsPressing(true),
    onPressOut: () => setIsPressing(false)
  }

  if ('to' in other) {
    element = (
      <InternalLink to={other.to} action={other.action} {...rootProps}>
        {element}
      </InternalLink>
    )
  } else if ('url' in other) {
    element = (
      <ExternalLink url={other.url} {...rootProps}>
        {element}
      </ExternalLink>
    )
  } else {
    element = (
      <TouchableWithoutFeedback {...rootProps}>
        {element}
      </TouchableWithoutFeedback>
    )
  }

  return <GestureDetector gesture={tap}>{element}</GestureDetector>
}
