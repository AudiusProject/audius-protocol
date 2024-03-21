import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ReactNativeStyle } from '@emotion/native'
import Color from 'color'
import type { TextStyle } from 'react-native'
import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'

import { useTheme } from '@audius/harmony-native'

import { BaseButton } from '../BaseButton/BaseButton'

import type { EntityActionButtonProps } from './types'

export const EntityActionButton = (props: EntityActionButtonProps) => {
  const { onPress, isActive, icon, style, ...other } = props
  const { color, spacing, cornerRadius, typography } = useTheme()
  const pressed = useSharedValue(0)

  const [active, setActive] = useState(isActive)
  useEffect(() => {
    setActive(isActive)
  }, [isActive])

  const handlePress = useCallback(() => {
    setActive((active) => !active)
    onPress?.()
  }, [onPress])

  const buttonStyles: ReactNativeStyle = {
    gap: spacing.s,
    height: spacing.unit12,
    paddingHorizontal: spacing.xl,
    borderRadius: cornerRadius.s,
    borderWidth: 1,
    borderStyle: 'solid'
  }

  const dynamicStyles = {
    default: {
      background: color.background.white,
      text: active ? color.primary.primary : color.text.default,
      icon: 'staticWhite',
      borderColor: active ? color.primary.primary : color.border.strong
    },
    press: {
      background: new Color(color.primary.primary).darken(0.2).hex(),
      text: color.text.staticWhite,
      icon: 'staticWhite',
      borderColor: new Color(color.primary.primary).darken(0.2).hex()
    }
  }

  const animatedButtonStyles = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        pressed.value,
        [0, 1],
        [dynamicStyles.default.borderColor, dynamicStyles.press.borderColor]
      ),
      backgroundColor: interpolateColor(
        pressed.value,
        [0, 1],
        [dynamicStyles.default.background, dynamicStyles.press.background]
      )
    }
  }, [active])

  const textStyles: TextStyle = {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.size.l,
    lineHeight: typography.lineHeight.l,
    textTransform: 'uppercase'
  }

  const animatedTextStyles = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        pressed.value,
        [0, 1],
        [dynamicStyles.default.text, dynamicStyles.press.text]
      )
    }
  }, [active])

  const [isPressing, setIsPressing] = useState(false)

  const handlePressIn = () => {
    setIsPressing(true)
  }
  const handlePressOut = () => {
    setIsPressing(false)
  }

  const iconColor = useMemo(() => {
    return isPressing ? 'staticWhite' : active ? 'active' : 'default'
  }, [isPressing, active])

  return (
    <BaseButton
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={handlePressOut}
      onPress={handlePress}
      innerProps={{
        icon: {
          ...icon,
          color: iconColor
        }
      }}
      style={[animatedButtonStyles, buttonStyles, style]}
      sharedValue={pressed}
      styles={{
        text: [textStyles, animatedTextStyles]
      }}
      {...other}
    />
  )
}
