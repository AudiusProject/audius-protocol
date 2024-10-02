import { useState } from 'react'

import type { ReactNativeStyle } from '@emotion/native'
import type { TextStyle } from 'react-native'
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'

import { useTheme } from '../../../foundations/theme'
import { BaseButton } from '../BaseButton/BaseButton'

import type { PlainButtonProps } from './types'

/**
 * A plain Button component (no border/background). Includes a few variants and options to
 * include and position icons.
 */
export const PlainButton = (props: PlainButtonProps) => {
  const { variant = 'default', size = 'default', styles, ...baseProps } = props
  const { disabled, isLoading, onPress } = baseProps
  const isDisabled = disabled || isLoading
  const isPressable = !isDisabled && onPress
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
    variant === 'subdued'
      ? subduedStyles
      : variant === 'inverted'
      ? invertedStyles
      : defaultVariantStyles

  const buttonStyles = {
    ...(isDisabled && { opacity: 0.2 }),
    ...(size === 'large' ? largeStyles : defaultStyles)
  }

  const animatedButtonStyles = useAnimatedStyle(
    () => ({
      ...(isPressable &&
        variant === 'inverted' && {
          opacity: interpolate(pressed.value, [0, 1], [1, 0.5])
        })
    }),
    [variant, isPressable]
  )

  const textCss: TextStyle = useAnimatedStyle(
    () => ({
      ...(isPressable && {
        color: interpolateColor(
          pressed.value,
          [0, 1],
          [dynamicStyles.default.text, dynamicStyles.press.text]
        )
      }),

      ...(size === 'large' ? largeTextStyles : defaultTextStyles)
    }),
    [size, isPressable]
  )

  const iconColor =
    isPressing && isPressable
      ? dynamicStyles.press.text
      : dynamicStyles.default.text

  return (
    <BaseButton
      sharedValue={pressed}
      style={[animatedButtonStyles, buttonStyles]}
      styles={{ text: textCss, ...styles }}
      innerProps={{
        icon: {
          fill: iconColor,
          size: size === 'large' ? 'm' : 's'
        }
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...baseProps}
    />
  )
}
