import { useCallback, useState } from 'react'

import { css } from '@emotion/native'
import { useLinkProps } from '@react-navigation/native'
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

import type { LinkProps, TextLinkProps } from './types'

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
    onPressIn: () => setIsPressing(true),
    onPressOut: () => setIsPressing(false)
  }

  if (to) {
    element = (
      <Link to={to} action={action} onPress={handlePress} {...rootProps}>
        {element}
      </Link>
    )
  } else {
    element = (
      <TouchableWithoutFeedback onPress={handlePress} {...other} {...rootProps}>
        {element}
      </TouchableWithoutFeedback>
    )
  }

  return <GestureDetector gesture={tap}>{element}</GestureDetector>
}

const Link = <ParamList extends ReactNavigation.RootParamList>(
  props: LinkProps<ParamList>
) => {
  const { to, action, onPress, children, ...other } = props
  const { onPress: onPressLink, ...linkProps } = useLinkProps({ to, action })

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress?.(e)
      onPressLink(e)
    },
    [onPress, onPressLink]
  )

  return (
    <TouchableWithoutFeedback onPress={handlePress} {...other} {...linkProps}>
      {children}
    </TouchableWithoutFeedback>
  )
}
