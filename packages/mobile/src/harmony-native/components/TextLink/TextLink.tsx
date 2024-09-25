import { useMemo } from 'react'

import { isInternalAudiusUrl } from '@audius/common/utils'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { useTheme } from '../../foundations/theme/useTheme'
import { Text } from '../Text/Text'

import {
  useHandlePressExternalUrl,
  useHandlePressInternalUrl,
  useHandlePressTo
} from './hooks'
import {
  isExternalLinkProps,
  isInternalLinkToProps,
  type TextLinkProps
} from './types'

const AnimatedText = Animated.createAnimatedComponent(Text)

/**
 * Simple component that styles a Text component as a link
 */
const TextPressable = (props: TextLinkProps) => {
  const {
    children,
    variant = 'default',
    textVariant,
    showUnderline,
    style,
    animatedPressed: animatedPressedProp,
    ...other
  } = props

  const { color, motion } = useTheme()

  const animatedPressedInternal = useSharedValue(0)
  const animatedPressed = animatedPressedProp ?? animatedPressedInternal

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
    visible: color.link.visible,
    inverted: color.static.white,
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
  // while still supporting proper Text layout. All this nesting is necessary
  return (
    <Text
      suppressHighlighting
      variant={textVariant}
      onPressIn={(e) => {
        animatedPressed.value = withTiming(1, motion.press)
      }}
      onPressOut={() => {
        animatedPressed.value = withTiming(0, motion.press)
      }}
      {...other}
    >
      <Text>
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
    </Text>
  )
}

/**
 * TextLink that supports 'url' | 'to' | 'onPress'
 *
 * Notably this component is Text all the way down so that it flows properly inline
 * with other Text components.
 */
export const TextLink = <ParamList extends ReactNavigation.RootParamList>(
  props: TextLinkProps<ParamList>
) => {
  const { onPress: onPressProp = () => {} } = props
  const isTo = isInternalLinkToProps(props)
  const isUrl = isExternalLinkProps(props)

  const url = isUrl ? props.url : ''

  const handlePressExternalUrl = useHandlePressExternalUrl({
    url: isUrl ? props.url : '',
    onPress: onPressProp
  })

  const handlePressInternalUrl = useHandlePressInternalUrl({
    url: isUrl ? props.url : '',
    onPress: onPressProp
  })

  const { onPress: handlePressTo, ...linkProps } = useHandlePressTo({
    to: isTo ? props.to ?? '' : '',
    action: isTo ? props.action : undefined
  })

  const onPress = useMemo(() => {
    if (isUrl) {
      if (isInternalAudiusUrl(url)) {
        return handlePressInternalUrl
      } else {
        return handlePressExternalUrl
      }
    } else if (isTo) {
      return handlePressTo
    } else {
      return onPressProp
    }
  }, [
    url,
    isUrl,
    isTo,
    handlePressInternalUrl,
    handlePressExternalUrl,
    handlePressTo,
    onPressProp
  ])

  return (
    <TextPressable {...props} onPress={onPress} {...(isTo ? linkProps : {})} />
  )
}
