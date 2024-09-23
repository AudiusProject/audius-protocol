import { isInternalAudiusUrl } from '@audius/common/utils'
import { TouchableOpacity } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { useTheme } from '../../foundations/theme/useTheme'
import { Text } from '../Text/Text'
import { Flex } from '../layout'

import { ExternalLink, useExternalLinkHandlePress } from './ExternalLink'
import {
  InternalLink,
  InternalLinkTo,
  useInternalLinkHandlePress
} from './InternalLink'
import type {
  TextLinkAnimationProps,
  TextLinkFlowingProps,
  TextLinkProps
} from './types'

const AnimatedText = Animated.createAnimatedComponent(Text)

const TextLinkAnimation = (props: TextLinkAnimationProps) => {
  const {
    children,
    variant = 'default',
    textVariant,
    showUnderline,
    style,
    animatedPressed,
    ...other
  } = props

  const { color } = useTheme()

  const variantColors = {
    default: color.link.default,
    subdued: color.link.subdued,
    visible: color.link.visible,
    inverted: color.static.white,
    active: color.primary.primary
  }

  const variantPressingColors = {
    default: color.primary.p300,
    subdued: color.primary.p300,
    visible: color.static.primary,
    inverted: color.static.primary,
    active: color.primary.primary
  }

  const animatedStyles = useAnimatedStyle(() => ({
    color: interpolateColor(
      animatedPressed.value,
      [0, 1],
      [variantColors[variant], variantPressingColors[variant]]
    )
  }))

  // Need to nest the AnimatedText inside a Text so the handlers & animation work
  // while still supporting proper Text layout
  return (
    <Text suppressHighlighting variant={textVariant} {...other}>
      <AnimatedText
        style={[
          style,
          animatedStyles,
          {
            textDecorationLine: showUnderline ? 'underline' : 'none'
          }
        ]}
      >
        {children}
      </AnimatedText>
    </Text>
  )
}

/**
 * TextLink component that supports internal and external links
 *
 * If you want to use this component inline with other Text, such as in UserGeneratedText,
 * use TextLinkFlowing instead
 */
export const TextLink = <ParamList extends ReactNavigation.RootParamList>(
  props: TextLinkProps<ParamList>
) => {
  const { onPress, source, endAdornment, ...other } = props
  const { motion } = useTheme()
  const animatedPressed = useSharedValue(0)

  const textElement = (
    <TextLinkAnimation {...props} animatedPressed={animatedPressed} />
  )

  const element = endAdornment ? (
    <Flex row gap='xs' alignItems='center'>
      {textElement}
      {endAdornment}
    </Flex>
  ) : (
    textElement
  )

  const rootProps = {
    onPress,
    onPressIn: () => {
      animatedPressed.value = withTiming(1, motion.press)
    },
    onPressOut: () => {
      animatedPressed.value = withTiming(0, motion.press)
    }
  }

  if ('to' in other) {
    return (
      <InternalLinkTo to={other.to} action={other.action} {...rootProps}>
        {element}
      </InternalLinkTo>
    )
  } else if ('url' in other && isInternalAudiusUrl(other.url)) {
    return (
      <InternalLink url={other.url} {...rootProps}>
        {element}
      </InternalLink>
    )
  } else if ('url' in other) {
    return (
      <ExternalLink url={other.url} source={source} {...rootProps}>
        {element}
      </ExternalLink>
    )
  } else {
    return <TouchableOpacity {...rootProps}>{element}</TouchableOpacity>
  }
}

/**
 *
 * TextLink that flows inline with other Text components
 * Used in UserGeneratedText
 *
 * Note: Does not support endAdornment
 */
export const TextLinkFlowing = <
  ParamList extends ReactNavigation.RootParamList
>(
  props: TextLinkFlowingProps<ParamList>
) => {
  const { onPress: onPressProp = () => {}, ...other } = props

  const { motion } = useTheme()
  const animatedPressed = useSharedValue(0)

  const isUrl = 'url' in other

  const handleExternalLinkPress = useExternalLinkHandlePress({
    url: isUrl ? other.url : '',
    onPress: onPressProp
  })

  const handleInternalLinkPress = useInternalLinkHandlePress({
    url: isUrl ? (other.url as string) : '',
    onPress: onPressProp
  })

  const getOnPress = () => {
    if (isUrl) {
      if (isInternalAudiusUrl(other.url)) {
        return handleInternalLinkPress
      } else {
        return handleExternalLinkPress
      }
    } else {
      return onPressProp
    }
  }

  return (
    <TextLinkAnimation
      {...props}
      animatedPressed={animatedPressed}
      onPress={getOnPress()}
      onPressIn={(e) => {
        animatedPressed.value = withTiming(1, motion.press)
      }}
      onPressOut={() => {
        animatedPressed.value = withTiming(0, motion.press)
      }}
    />
  )
}
