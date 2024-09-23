import { isInteralAudiusUrl } from '@audius/common/utils'
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

import { ExternalLink } from './ExternalLink'
import { InternalLink, InternalLinkTo } from './InternalLink'
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
    source,
    style,
    endAdornment,
    ...other
  } = props
  const { color, motion } = useTheme()
  const pressed = useSharedValue(0)

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
      pressed.value,
      [0, 1],
      [variantColors[variant], variantPressingColors[variant]]
    )
  }))

  const element = (
    <Flex row gap='xs' alignItems='center'>
      <AnimatedText
        style={[
          style,
          animatedStyles,
          { textDecorationLine: showUnderline ? 'underline' : 'none' }
        ]}
        variant={textVariant}
        {...other}
      >
        {children}
      </AnimatedText>
      {endAdornment}
    </Flex>
  )

  const rootProps = {
    onPress,
    onPressIn: () => {
      pressed.value = withTiming(1, motion.press)
    },
    onPressOut: () => {
      pressed.value = withTiming(0, motion.press)
    }
  }

  if ('to' in other) {
    return (
      <InternalLinkTo to={other.to} action={other.action} {...rootProps}>
        {element}
      </InternalLinkTo>
    )
  } else if ('url' in other && isInteralAudiusUrl(other.url)) {
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
