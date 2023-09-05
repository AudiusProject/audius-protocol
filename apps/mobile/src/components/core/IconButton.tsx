import type { Insets, StyleProp, ViewStyle } from 'react-native'
import { Animated, TouchableOpacity, View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import type { StylesProps } from 'app/styles'
import { makeStyles } from 'app/styles/makeStyles'
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
  onPress?: GestureResponderHandler
  hitSlop?: Insets
} & StylesProps<{ root?: StyleProp<ViewStyle>; icon?: StyleProp<ViewStyle> }>

const useStyles = makeStyles(() => ({
  icon: {
    height: 18,
    width: 18
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
  icon: Icon,
  isDisabled,
  onPress,
  style,
  styles: stylesProp,
  hitSlop
}: IconButtonProps) => {
  const styles = useStyles()
  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.9)
  const { neutral } = useThemeColors()

  const fill = inputFill ?? neutral

  return (
    <Animated.View
      style={[{ transform: [{ scale }] }, stylesProp?.root, style]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.95}
        hitSlop={{ ...defaultHitSlop, ...hitSlop }}
      >
        <View
          style={[
            styles.icon,
            isDisabled && { opacity: 0.5 },
            stylesProp?.icon
          ]}
        >
          <Icon fill={fill} height='100%' width='100%' />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}
