import { useState } from 'react'

import type { ReactNativeStyle } from '@emotion/native'
import type { TextStyle } from 'react-native/types'
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'

import { useTheme } from '../../../foundations/theme'
import { BaseButton } from '../BaseButton/BaseButton'
import type { PlainButtonProps } from '../types'
import { PlainButtonSize, PlainButtonType } from '../types'

/**
 * A plain Button component (no border/background). Includes a few variants and options to
 * include and position icons.
 */
export const PlainButton = (props: PlainButtonProps) => {
  const {
    variant = PlainButtonType.DEFAULT,
    size = PlainButtonSize.DEFAULT,
    ...baseProps
  } = props
  const isDisabled = baseProps.disabled || baseProps.isLoading
  const { color, spacing, typography } = useTheme()
  const pressed = useSharedValue(0)
  const [isPressing, setIsPressing] = useState(false)

  const handlePressIn = () => {
    setIsPressing(true)
  }
  const handlePressOut = () => {
    setIsPressing(false)
  }

  // - Size Styles -
  const defaultStyles: ReactNativeStyle = {
    gap: spacing.xs,
    height: 16
  }
  const defaultTextStyles: TextStyle = {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.size.s,
    fontWeight: `${typography.weight.bold}` as TextStyle['fontWeight'],
    lineHeight: typography.lineHeight.s,
    textTransform: 'capitalize'
  }

  const largeStyles: ReactNativeStyle = {
    gap: spacing.s,
    height: 20
  }
  const largeTextStyles: TextStyle = {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.size.l,
    fontWeight: `${typography.weight.bold}` as TextStyle['fontWeight'],
    lineHeight: typography.lineHeight.m,
    textTransform: 'capitalize'
  }

  // - Variant Styles -
  const defaultVariantStyles = {
    default: {
      text: color.text.default
    },
    press: {
      text: color.secondary.s500
    }
  }

  const subduedStyles = {
    default: {
      text: color.text.subdued
    },
    press: {
      text: color.secondary.s500
    }
  }

  const invertedStyles = {
    default: {
      text: color.static.white
    },
    press: {
      text: color.static.white
    }
  }

  const dynamicStyles =
    variant === PlainButtonType.SUBDUED
      ? subduedStyles
      : variant === PlainButtonType.INVERTED
      ? invertedStyles
      : defaultVariantStyles

  const buttonCss: ReactNativeStyle = useAnimatedStyle(() => ({
    ...(!isDisabled &&
      variant === PlainButtonType.INVERTED && {
        opacity: interpolate(pressed.value, [0, 1], [1, 0.5])
      }),

    ...(size === PlainButtonSize.LARGE ? largeStyles : defaultStyles)
  }))

  const textCss: TextStyle = useAnimatedStyle(() => ({
    ...(!isDisabled && {
      color: interpolateColor(
        pressed.value,
        [0, 1],
        [dynamicStyles.default.text, dynamicStyles.press.text]
      )
    }),

    ...(size === PlainButtonSize.LARGE ? largeTextStyles : defaultTextStyles)
  }))

  const iconColor =
    isPressing && !isDisabled
      ? dynamicStyles.press.text
      : dynamicStyles.default.text

  return (
    <BaseButton
      sharedValue={pressed}
      style={buttonCss}
      styles={{ text: textCss }}
      innerProps={{
        icon: {
          fill: iconColor,
          size: size === PlainButtonSize.LARGE ? 'l' : 'm'
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...baseProps}
    />
  )
}
