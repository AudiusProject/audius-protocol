import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'

import { useTheme } from 'app/harmony-native/foundations/theme'
import type { Icon, IconProps } from 'app/harmony-native/icons'

import { BaseButton } from '../BaseButton/BaseButton'
import type { BaseButtonProps } from '../types'

export type IconButtonProps = {
  icon: Icon
  ripple?: boolean
  accessibilityLabel: string
} & Pick<IconProps, 'color' | 'size' | 'shadow'> &
  Pick<BaseButtonProps, 'onPress' | 'disabled'>

export const IconButton = (props: IconButtonProps) => {
  const {
    icon: Icon,
    color: iconColor,
    size = 'l',
    shadow,
    ripple,
    ...other
  } = props
  const { disabled } = other
  const pressed = useSharedValue(0)
  const { color, spacing } = useTheme()

  const buttonStyles = {
    borderRadius: 1000,
    padding: spacing.xs
  }

  const rippleStyles = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pressed.value,
      [0, 1],
      ['transparent', color.neutral.n150]
    )
  }))

  return (
    <BaseButton
      {...other}
      style={[buttonStyles, ripple ? rippleStyles : undefined]}
      sharedValue={pressed}
    >
      <Icon
        color={disabled ? 'disabled' : iconColor}
        size={size}
        shadow={shadow}
      />
    </BaseButton>
  )
}
