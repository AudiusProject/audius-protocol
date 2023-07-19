import type {
  Insets,
  StyleProp,
  TouchableOpacityProps,
  ViewStyle
} from 'react-native'
import { Animated, TouchableOpacity, View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useToast } from 'app/hooks/useToast'
import type { StylesProps } from 'app/styles'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'
import { useThemeColors } from 'app/utils/theme'

export type IconButtonProps = {
  fill?: string
  icon: React.FC<
    SvgProps & {
      fillSecondary?: string
    }
  >
  isDisabled?: boolean
  disabledPressToastContent?: string | JSX.Element
  onPress?: GestureResponderHandler
  fullWidth?: boolean
  hitSlop?: Insets
} & StylesProps<{ root?: StyleProp<ViewStyle>; icon?: StyleProp<ViewStyle> }> &
  Omit<TouchableOpacityProps, 'hitSlop'>

const useStyles = makeStyles(() => ({
  icon: {
    height: 18,
    width: 18,
    justifyContent: 'center',
    alignItems: 'center'
  }
}))

const defaultHitSlop = { top: 12, right: 12, bottom: 12, left: 12 }

/**
 * A button with touchable feedback that is only an
 * icon. Different from a Button in that it has no
 * container.
 *
 * The default size is 18x18 but this can be overridden via styles.icon
 */
export const IconButton = ({
  fill: inputFill,
  fullWidth = true,
  icon: Icon,
  isDisabled,
  disabledPressToastContent,
  onPress,
  style,
  styles: stylesProp,
  hitSlop,
  ...other
}: IconButtonProps) => {
  const styles = useStyles()
  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.9)
  const { neutral } = useThemeColors()
  const { toast } = useToast()

  const onDisabledPress = () => {
    if (disabledPressToastContent) {
      toast({ content: disabledPressToastContent })
    }
  }

  const fill = inputFill ?? neutral

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
        <View
          style={[
            styles.icon,
            stylesProp?.icon,
            isDisabled && { opacity: 0.5 }
          ]}
        >
          <Icon
            fill={fill}
            height='100%'
            {...(fullWidth ? { width: '100%' } : {})}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}
