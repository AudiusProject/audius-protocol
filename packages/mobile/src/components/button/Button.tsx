import { useMemo } from 'react'

import type { ViewStyle, TextStyle, StyleProp, ColorValue } from 'react-native'
import { TouchableHighlight, View, Animated } from 'react-native'

import Text from 'app/components/text'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { flexRowCentered, makeStyles } from 'app/styles'
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors, useThemePalette } from 'app/utils/theme'

export enum ButtonType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  COMMON = 'common'
}

type ButtonTypeStyleConfig = { type: ButtonType; palette: ThemeColors }

const createButtonTypeStyles = ({ type, palette }: ButtonTypeStyleConfig) => {
  const buttonTypeStyles = {
    [ButtonType.PRIMARY]: {
      buttonContainer: {
        backgroundColor: palette.primary
      },
      button: {},
      buttonText: {
        color: palette.staticWhite
      },
      icon: {
        color: palette.staticWhite
      }
    },
    [ButtonType.SECONDARY]: {
      buttonContainer: {
        backgroundColor: palette.secondary
      },
      button: {},
      buttonText: {
        color: palette.staticWhite
      },
      icon: {
        color: palette.staticWhite
      }
    },
    [ButtonType.COMMON]: {
      buttonContainer: {
        backgroundColor: palette.white,
        borderWidth: 1,
        borderColor: palette.neutralLight6
      },
      button: {
        paddingVertical: 14,
        paddingHorizontal: 24
      },
      buttonText: {
        color: palette.neutralLight2,
        fontSize: 16
      },
      icon: {
        color: palette.neutralLight2
      }
    }
  }
  return buttonTypeStyles[type]
}

const useStyles = makeStyles(({ palette }) => ({
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
  iconLeft: {
    marginRight: 12
  },
  iconRight: {
    marginLeft: 12
  },
  disabled: {
    backgroundColor: palette.staticNeutralLight8
  }
}))

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
  renderIcon?: (color: ColorValue) => React.ReactElement
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
  const palette = useThemePalette()
  const styles = useStyles()
  const typeStyles = useMemo(
    () => createButtonTypeStyles({ type, palette }),
    [type, palette]
  )
  const { primaryDark1 } = useThemeColors()
  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation()

  // If underlay is set to undefined, the button will turn black when pressed
  const underlay =
    type === ButtonType.PRIMARY ? underlayColor || primaryDark1 : 'transparent'

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        typeStyles.buttonContainer,
        { transform: [{ scale }] },
        containerStyle,
        disabled && !ignoreDisabledStyle ? styles.disabled : {}
      ]}
    >
      <TouchableHighlight
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        underlayColor={underlay}
        style={[styles.button, typeStyles.button, style]}
      >
        <View style={styles.buttonContent}>
          {(icon || renderIcon) && iconPosition === 'left' ? (
            <View style={[styles.iconLeft, iconStyle]}>
              {renderIcon ? renderIcon(typeStyles.icon.color) : icon}
            </View>
          ) : null}
          <Text style={[styles.buttonText, typeStyles.buttonText, textStyle]}>
            {title}
          </Text>
          {(icon || renderIcon) && iconPosition === 'right' ? (
            <View style={[styles.iconRight, iconStyle]}>
              {renderIcon ? renderIcon(typeStyles.icon.color) : icon}
            </View>
          ) : null}
        </View>
      </TouchableHighlight>
    </Animated.View>
  )
}

export default Button
