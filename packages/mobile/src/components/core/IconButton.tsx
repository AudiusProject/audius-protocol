import type {
  Insets,
  StyleProp,
  TouchableOpacityProps,
  ViewStyle
} from 'react-native'
import { Animated, TouchableOpacity } from 'react-native'

import type { IconComponent, IconProps } from '@audius/harmony-native'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useToast } from 'app/hooks/useToast'
import type { StylesProps } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

export type IconButtonProps = {
  color?: IconProps['color']
  icon: IconComponent
  isDisabled?: boolean
  disabledPressToastContent?: string | JSX.Element
  onPress?: GestureResponderHandler
  hitSlop?: Insets
  size?: IconProps['size']
} & StylesProps<{ root?: StyleProp<ViewStyle>; icon?: StyleProp<ViewStyle> }> &
  Omit<TouchableOpacityProps, 'hitSlop'>

const defaultHitSlop = { top: 12, right: 12, bottom: 12, left: 12 }

/**
 * A button with touchable feedback that is only an
 * icon. Different from a Button in that it has no
 * container.
 *
 * The default size is 18x18 but this can be overridden via styles.icon
 */
export const IconButton = ({
  color = 'default',
  icon: Icon,
  isDisabled,
  disabledPressToastContent,
  onPress,
  style,
  styles: stylesProp,
  hitSlop,
  size = 'l',
  ...other
}: IconButtonProps) => {
  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.9)
  const { toast } = useToast()

  const onDisabledPress = () => {
    if (disabledPressToastContent) {
      toast({ content: disabledPressToastContent })
    }
  }

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, stylesProp?.root, style]}
    >
      <TouchableOpacity
        onPress={isDisabled ? onDisabledPress : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled && !disabledPressToastContent}
        activeOpacity={0.95}
        hitSlop={{ ...defaultHitSlop, ...hitSlop }}
        {...other}
      >
        <Icon
          style={[
            stylesProp?.icon,
            isDisabled && { opacity: 0.5, width: '100%' }
          ]}
          color={color}
          size={size}
        />
      </TouchableOpacity>
    </Animated.View>
  )
}
