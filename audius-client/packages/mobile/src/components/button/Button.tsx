import React, { useRef } from 'react'

import { merge } from 'lodash'
import {
  TouchableHighlight,
  ViewStyle,
  StyleSheet,
  TextStyle,
  View,
  Animated,
  StyleProp,
  ColorValue
} from 'react-native'

import Text from 'app/components/text'
import { ThemeColors, useThemedStyles } from 'app/hooks/useThemedStyles'
import { useThemeColors } from 'app/utils/theme'

export enum ButtonType {
  PRIMARY = 'primary',
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
  [ButtonType.COMMON]: (themeColors: ThemeColors) => ({
    buttonContainer: {
      backgroundColor: themeColors.white,
      borderWidth: 1,
      borderColor: themeColors.neutralLight6
    },
    buttonText: {
      color: themeColors.neutralLight4
    }
  })
}

const createStyles = (type: ButtonType = ButtonType.PRIMARY) => (
  themeColors: ThemeColors
) =>
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
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
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
  renderIcon?: (color: ColorValue) => React.ReactElement
  iconPosition?: 'left' | 'right'
  containerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  disabled?: boolean
  ignoreDisabledStyle?: boolean
  underlayColor?: string
}

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
  disabled = false,
  ignoreDisabledStyle = false,
  underlayColor
}: ButtonProps) => {
  const styles: ButtonStyle = useThemedStyles(createStyles(type))
  const { primaryDark1 } = useThemeColors()
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 100,
      delay: 0,
      useNativeDriver: true
    }).start()
  }

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      delay: 0,
      useNativeDriver: true
    }).start()
  }

  const underlay =
    type === ButtonType.PRIMARY ? underlayColor || primaryDark1 : undefined

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
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
        style={[styles.button, style]}
      >
        <View style={styles.buttonContent}>
          {(icon || renderIcon) && iconPosition === 'left' ? (
            <View style={styles.iconLeft}>
              {renderIcon ? renderIcon(styles.icon.color!) : icon}
            </View>
          ) : null}
          <Text style={[styles.buttonText, textStyle]}>{title}</Text>
          {(icon || renderIcon) && iconPosition === 'right' ? (
            <View style={styles.iconRight}>
              {renderIcon ? renderIcon(styles.icon.color!) : icon}
            </View>
          ) : null}
        </View>
      </TouchableHighlight>
    </Animated.View>
  )
}

export default Button
