import React, { useCallback } from 'react'

import type {
  ButtonProps,
  GestureResponderEvent,
  PressableProps,
  ViewStyle
} from 'react-native'
import { Animated, Pressable, Text } from 'react-native'

import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import type { StylesProps } from 'app/styles'
import { makeStyles, shadow } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    backgroundColor: palette.white
  },
  pillLarge: {
    ...shadow()
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing(6),
    paddingLeft: spacing(3),
    paddingRight: spacing(3),
    gap: spacing(1),
    width: '100%'
  },
  pressableLarge: {
    height: spacing(8),
    paddingLeft: spacing(4),
    paddingRight: spacing(4)
  },
  text: {
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.medium,
    color: palette.neutralLight4,
    lineHeight: 1.25 * typography.fontSize.medium
  },
  textLarge: {
    color: palette.neutral
  },
  pressed: {
    backgroundColor: palette.secondaryLight1,
    borderColor: palette.secondary
  },
  textPressed: {
    color: palette.staticWhite
  },
  icon: {
    marginRight: spacing(1),
    width: spacing(4),
    height: spacing(4)
  }
}))

type HarmonySelectablePillProps = Omit<ButtonProps, 'title'> &
  PressableProps & {
    isSelected: boolean
    icon?: React.ReactElement
    label: string
    size?: 'default' | 'large'
  } & StylesProps<{ root: ViewStyle }>

export const HarmonySelectablePill = (props: HarmonySelectablePillProps) => {
  const styles = useStyles()
  const {
    isSelected,
    label,
    icon,
    onPressIn,
    onPressOut,
    size,
    style,
    ...other
  } = props

  const {
    scale,
    handlePressIn: handlePressInScale,
    handlePressOut: handlePressOutScale
  } = usePressScaleAnimation()

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      onPressIn?.(event)
      handlePressInScale()
    },
    [handlePressInScale, onPressIn]
  )

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      onPressOut?.(event)
      handlePressOutScale()
    },
    [handlePressOutScale, onPressOut]
  )

  return (
    <Animated.View
      style={[
        styles.pill,
        size === 'large' ? styles.pillLarge : undefined,
        isSelected ? styles.pressed : undefined,
        { transform: [{ scale }] },
        style
      ]}
    >
      <Pressable
        accessibilityRole='button'
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.pressable,
          size === 'large' ? styles.pressableLarge : undefined
        ]}
        {...other}
      >
        {icon || null}
        <Text
          style={[
            styles.text,
            size === 'large' ? styles.textLarge : undefined,
            isSelected ? styles.textPressed : undefined
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  )
}
