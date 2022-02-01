import { Animated, StyleProp, View, ViewStyle } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SvgProps } from 'react-native-svg'

import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useThemeColors } from 'app/utils/theme'

export type IconButtonProps = {
  onPress?: () => void
  icon: React.FC<
    SvgProps & {
      fillSecondary?: string
    }
  >
  containerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  isActive?: boolean
  isDisabled?: boolean
}

/**
 * A button with touchable feedback that is only an
 * icon. Different from a Button in that it has no
 * container.
 */
const IconButton = ({
  onPress,
  icon: Icon,
  containerStyle,
  style,
  isActive,
  isDisabled
}: IconButtonProps) => {
  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.9)
  const { neutral, neutralLight4, primary } = useThemeColors()

  let fill = neutral
  if (isActive) {
    fill = primary
  } else if (isDisabled) {
    fill = neutralLight4
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, containerStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.95}
        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
      >
        <View style={style}>
          <Icon fill={fill} height='100%' width='100%' />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default IconButton
