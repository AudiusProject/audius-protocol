import { merge } from 'lodash'
import {
  TouchableHighlight,
  ViewStyle,
  StyleSheet,
  TextStyle,
  View,
  Animated,
  StyleProp
} from 'react-native'
import { Color } from 'react-native-svg'

import Text from 'app/components/text'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { ThemeColors, useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

export enum ButtonType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  COMMON = 'common'
}

interface ButtonStyle {
  buttonContainer: ViewStyle
  button: ViewStyle
  buttonContent: ViewStyle
  buttonText: TextStyle
  icon: TextStyle
  iconRight: ViewStyle
  iconLeft: ViewStyle
  disabled: ViewStyle
}

const buttonTypeStyles = {
  [ButtonType.PRIMARY]: (themeColors: ThemeColors) => ({
    buttonContainer: {
      backgroundColor: themeColors.primary
    },
    buttonText: {
      color: themeColors.staticWhite
    },
    icon: {
      color: themeColors.staticWhite
    }
  }),
  [ButtonType.SECONDARY]: (themeColors: ThemeColors) => ({
    buttonContainer: {
      backgroundColor: themeColors.secondary
    },
    buttonText: {
      color: themeColors.staticWhite
    },
    icon: {
      color: themeColors.staticWhite
    }
  }),
  [ButtonType.COMMON]: (themeColors: ThemeColors) => ({
    buttonContainer: {
      backgroundColor: themeColors.white,
      borderWidth: 1,
      borderColor: themeColors.neutralLight6
    },
    button: {
      paddingVertical: 14,
      paddingHorizontal: 24
    },
    buttonText: {
      color: themeColors.neutralLight2,
      fontSize: 16
    },
    icon: {
      color: themeColors.neutralLight2
    }
  })
}

const createStyles =
  (type: ButtonType = ButtonType.PRIMARY) =>
  (themeColors: ThemeColors) =>
    StyleSheet.create(
      merge(
        {
          buttonContainer: {
            borderRadius: 4
          },
          button: {
            padding: 16,
            borderRadius: 4
          },
          buttonContent: {
            ...flexRowCentered(),
            justifyContent: 'center'
          },
          buttonText: {
            fontSize: 18,
            fontFamily: 'AvenirNextLTPro-Bold'
          },
          icon: {
            color: themeColors.neutralLight4
          },
          iconLeft: {
            marginRight: 12
          },
          iconRight: {
            marginLeft: 12
          },
          disabled: {
            backgroundColor: '#E7E6EB'
          }
        },
        buttonTypeStyles[type](themeColors)
      ) as ButtonStyle
    )

export type ButtonProps = {
  title: string
  onPress: () => void
  type?: ButtonType
  /**
   * The element to render for the icon
   * @deprecated use the `renderIcon` prop instead in order to ensure the proper color is used to style the icon.
   */
  icon?: React.ReactElement
  /**
   * Callback accepting the themed color of the button text that returns the resulting icon element.
   * Takes priority over the `icon` prop. Define the callback outside of a render function to prevent rerenders.
   * @example
   * const renderIconArrow = color => <IconArrow fill={color} />
   * export const myComponent = () => <Button renderIcon={renderIconArrow} />
   */
  renderIcon?: (color: Color) => React.ReactElement
  iconPosition?: 'left' | 'right'
  containerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  iconStyle?: StyleProp<ViewStyle>
  disabled?: boolean
  ignoreDisabledStyle?: boolean
  underlayColor?: string
}

/**
 * @deprecated use `import { Button } from 'app/components/core'`
 */
const Button = ({
  title,
  onPress,
  type = ButtonType.PRIMARY,
  icon,
  renderIcon,
  iconPosition = 'right',
  containerStyle,
  style,
  textStyle,
  iconStyle,
  disabled = false,
  ignoreDisabledStyle = false,
  underlayColor
}: ButtonProps) => {
  const styles: ButtonStyle = useThemedStyles(createStyles(type))
  const { primaryDark1 } = useThemeColors()
  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation()

  // If underlay is set to undefined, the button will turn black when pressed
  const underlay =
    type === ButtonType.PRIMARY ? underlayColor || primaryDark1 : 'transparent'

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        { transform: [{ scale }] },
        containerStyle,
        disabled && !ignoreDisabledStyle ? styles.disabled : {}
      ]}>
      <TouchableHighlight
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        underlayColor={underlay}
        style={[styles.button, style]}>
        <View style={styles.buttonContent}>
          {(icon || renderIcon) && iconPosition === 'left' ? (
            <View style={[styles.iconLeft, iconStyle]}>
              {renderIcon ? renderIcon(styles.icon.color as Color) : icon}
            </View>
          ) : null}
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
          {(icon || renderIcon) && iconPosition === 'right' ? (
            <View style={[styles.iconRight, iconStyle]}>
              {renderIcon ? renderIcon(styles.icon.color as Color) : icon}
            </View>
          ) : null}
        </View>
      </TouchableHighlight>
    </Animated.View>
  )
}

export default Button
