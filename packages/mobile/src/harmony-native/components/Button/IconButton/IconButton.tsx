import { useCallback } from 'react'

import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'

import { useTheme } from 'app/harmony-native/foundations/theme'
import type { Icon, IconProps } from 'app/harmony-native/icons'
import { useToast } from 'app/hooks/useToast'

import { BaseButton } from '../BaseButton/BaseButton'
import type { BaseButtonProps } from '../BaseButton/types'

export type IconButtonProps = {
  icon: Icon
  ripple?: boolean
  style?: StyleProp<ViewStyle>
  disabledHint?: string
} & Pick<IconProps, 'color' | 'size' | 'shadow'> &
  Omit<BaseButtonProps, 'fill' | 'styles'> &
  (
    | {
        accessibilityLabel?: string
      }
    // TODO: make arial-label or accessibilityLabel required
    | { 'aria-label'?: string }
  )

export const IconButton = (props: IconButtonProps) => {
  const {
    icon: Icon,
    color: iconColor = 'default',
    size = 'l',
    shadow,
    ripple,
    style,
    onPress,
    disabled,
    disabledHint,
    ...other
  } = props
  const pressed = useSharedValue(0)
  const { color, spacing } = useTheme()
  const { toast } = useToast()

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

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) {
        onPress?.(e)
      } else if (disabledHint) {
        toast({ content: disabledHint })
      }
    },
    [disabled, disabledHint, onPress, toast]
  )

  return (
    <BaseButton
      {...other}
      style={[buttonStyles, ripple ? rippleStyles : undefined, style]}
      sharedValue={pressed}
      onPress={handlePress}
      disabled={disabled && !disabledHint}
      pressScale={0.9}
    >
      <Icon
        color={disabled ? 'disabled' : iconColor}
        size={size}
        shadow={shadow}
      />
    </BaseButton>
  )
}
