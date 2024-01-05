import { useMemo, useState } from 'react'

import type { IconColors } from '@audius/harmony'
import type { ReactNativeStyle } from '@emotion/native'
import Color from 'color'
import type { TextStyle } from 'react-native/types'
import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'

import type { IconProps } from 'app/harmony-native/icons'

import { useTheme } from '../../../foundations/theme'
import { BaseButton } from '../BaseButton/BaseButton'
import type { ButtonProps } from '../types'
import { ButtonSize, ButtonType } from '../types'

export const Button = (props: ButtonProps) => {
  const {
    color,
    hexColor,
    variant = ButtonType.PRIMARY,
    size = ButtonSize.DEFAULT,
    disabled,
    ...baseProps
  } = props
  const { isLoading } = baseProps
  const pressed = useSharedValue(0)

  const isDisabled = disabled || isLoading
  const {
    type,
    color: themeColors,
    cornerRadius,
    shadows,
    spacing,
    typography
  } = useTheme()

  // - Size Styles -
  const smallStyles: ReactNativeStyle = {
    gap: spacing.xs,
    height: spacing.unit8,
    paddingHorizontal: spacing.m
  }
  const smallTextStyles: TextStyle = {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.size.s,
    fontWeight: `${typography.weight.bold}` as TextStyle['fontWeight'],
    lineHeight: typography.lineHeight.s,
    textTransform: 'capitalize'
  }

  const defaultStyles: ReactNativeStyle = {
    gap: spacing.s,
    height: spacing.unit12,
    paddingHorizontal: spacing.xl
  }
  const defaultTextStyles: TextStyle = {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.size.l,
    fontWeight: `${typography.weight.bold}` as TextStyle['fontWeight'],
    lineHeight: typography.lineHeight.l,
    textTransform: 'capitalize'
  }

  const largeStyles: ReactNativeStyle = {
    gap: spacing.s,
    height: spacing.unit16,
    paddingHorizontal: spacing.xl
  }
  const largeTextStyles: TextStyle = {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.size.xl,
    fontWeight: `${typography.weight.bold}` as TextStyle['fontWeight'],
    lineHeight: typography.lineHeight.l,
    letterSpacing: 0.25,
    textTransform: 'uppercase'
  }

  // - Variant Styles -
  const primaryOverrideColor =
    hexColor ?? (color ? themeColors.special[color] : null)

  const primaryStyles: ReactNativeStyle = {
    ...(isDisabled && {
      backgroundColor: themeColors.neutral.n150
    })
  }
  const primaryDynamicStyles = {
    default: {
      background: primaryOverrideColor ?? themeColors.primary.primary,
      text: themeColors.text.staticWhite,
      icon: 'staticWhite',
      border: primaryOverrideColor ?? themeColors.primary.primary
    },
    press: {
      background: new Color(primaryOverrideColor ?? themeColors.primary.primary)
        .darken(0.2)
        .hex(),
      text: themeColors.text.staticWhite,
      icon: 'staticWhite',
      border: new Color(primaryOverrideColor ?? themeColors.primary.primary)
        .darken(0.2)
        .hex()
    }
  }

  const secondaryStyles: ReactNativeStyle = {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: themeColors.border.strong,

    ...(isDisabled && {
      backgroundColor: themeColors.neutral.n150
    })
  }
  const secondaryDynamicStyles = {
    default: {
      background: 'transparent',
      text: themeColors.text.default,
      icon: 'default',
      border: themeColors.border.strong
    },
    press: {
      background: new Color(primaryOverrideColor ?? themeColors.primary.primary)
        .darken(0.2)
        .hex(),
      text: themeColors.text.staticWhite,
      icon: 'staticWhite',
      border: new Color(primaryOverrideColor ?? themeColors.primary.primary)
        .darken(0.2)
        .hex()
    }
  }

  const tertiaryStyles: ReactNativeStyle = {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: themeColors.border.default,

    // TODO: Need to add blur
    // Could use BlurView or try something native
    // backdropFilter: 'blur(6px)',

    ...(isDisabled && {
      opacity: 0.45
    })
  }
  const tertiaryDynamicStyles = {
    default: {
      background: type === 'dark' ? '#32334d99' : '#ffffffd9',
      text: themeColors.text.default,
      icon: 'default',
      border: themeColors.border.default
    },
    press: {
      background: themeColors.background.surface2,
      text: themeColors.text.default,
      icon: 'default',
      border: themeColors.border.strong
    }
  }

  const destructiveStyles: ReactNativeStyle = {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: themeColors.special.red,

    ...(isDisabled && {
      opacity: 0.45
    })
  }
  const destructiveDynamicStyles = {
    default: {
      background: 'transparent',
      text: themeColors.text.danger,
      icon: 'danger',
      border: themeColors.special.red
    },
    press: {
      background: themeColors.special.red,
      text: themeColors.text.staticWhite,
      icon: 'staticWhite',
      border: themeColors.special.red
    }
  }

  const dynamicStyles =
    variant === ButtonType.SECONDARY
      ? secondaryDynamicStyles
      : variant === ButtonType.TERTIARY
      ? tertiaryDynamicStyles
      : variant === ButtonType.DESTRUCTIVE
      ? destructiveDynamicStyles
      : primaryDynamicStyles

  const buttonCss: ReactNativeStyle = useAnimatedStyle(() => ({
    borderWidth: 0,
    borderRadius: cornerRadius.s,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.near,

    ...(!isDisabled && {
      borderColor: interpolateColor(
        pressed.value,
        [0, 1],
        [dynamicStyles.default.border, dynamicStyles.press.border]
      ),
      backgroundColor: interpolateColor(
        pressed.value,
        [0, 1],
        [dynamicStyles.default.background, dynamicStyles.press.background]
      )
    }),

    ...(variant === ButtonType.SECONDARY
      ? secondaryStyles
      : variant === ButtonType.TERTIARY
      ? tertiaryStyles
      : variant === ButtonType.DESTRUCTIVE
      ? destructiveStyles
      : primaryStyles),

    ...(size === ButtonSize.SMALL
      ? smallStyles
      : size === ButtonSize.LARGE
      ? largeStyles
      : defaultStyles),

    ...(isDisabled && { shadowColor: 'transparent' })
  }))

  const textCss: TextStyle = useAnimatedStyle(() => ({
    ...(!isDisabled && {
      color: interpolateColor(
        pressed.value,
        [0, 1],
        [dynamicStyles.default.text, dynamicStyles.press.text]
      )
    }),

    ...(size === ButtonSize.SMALL
      ? smallTextStyles
      : size === ButtonSize.LARGE
      ? largeTextStyles
      : defaultTextStyles)
  }))

  const textColor =
    (variant === ButtonType.SECONDARY && !isDisabled) ||
    variant === ButtonType.TERTIARY
      ? 'default'
      : variant === ButtonType.DESTRUCTIVE
      ? 'danger'
      : 'staticWhite'

  const iconSize: IconProps['size'] =
    size === ButtonSize.SMALL ? 's' : size === ButtonSize.LARGE ? 'l' : 'm'

  const loaderSize =
    size === ButtonSize.SMALL ? 16 : size === ButtonSize.LARGE ? 24 : 20

  const [isPressing, setIsPressing] = useState(false)

  const handlePressIn = () => {
    setIsPressing(true)
  }
  const handlePressOut = () => {
    setIsPressing(false)
  }

  const iconColor = useMemo(() => {
    if (isDisabled && variant === ButtonType.SECONDARY) {
      return 'staticWhite'
    }

    return isPressing && !isDisabled
      ? dynamicStyles.press.icon
      : dynamicStyles.default.icon
  }, [
    dynamicStyles.default.icon,
    dynamicStyles.press.icon,
    isDisabled,
    isPressing,
    variant
  ])

  return (
    <BaseButton
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={buttonCss}
      sharedValue={pressed}
      styles={{
        text: textCss
      }}
      innerProps={{
        text: {
          color: textColor
        },
        icon: {
          color: iconColor as IconColors,
          size: iconSize
        },
        loader: {
          style: {
            height: loaderSize,
            width: loaderSize
          },
          fill: themeColors.text[textColor]
        }
      }}
      {...baseProps}
    />
  )
}
