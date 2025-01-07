import React, { useCallback, useEffect, useState } from 'react'

import { useControlled } from '@audius/harmony/src/hooks/useControlled'
import { css } from '@emotion/native'
import { Pressable } from 'react-native'
import type { GestureResponderEvent } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { DEFAULT_HIT_SLOP } from '@audius/harmony-native'

import { useTheme } from '../../../foundations/theme'
import { Text } from '../../Text/Text'
import { Flex } from '../../layout'

import type { SelectablePillProps } from './types'

const AnimatedFlex = Animated.createAnimatedComponent(Flex)
const AnimatedText = Animated.createAnimatedComponent(Text)

export const SelectablePill = (props: SelectablePillProps) => {
  const {
    type,
    icon: Icon,
    label,
    size = 'small',
    isSelected: isSelectedProp,
    disabled,
    onPress,
    onChange,
    value,
    style: styleProp,
    fullWidth,
    disableUnselectAnimation,
    ...other
  } = props
  const {
    color,
    motion,
    cornerRadius,
    typography,
    type: themeType
  } = useTheme()
  const [isPressing, setIsPressing] = useState(false)
  const [isSelected, setIsSelected] = useControlled({
    controlledProp: isSelectedProp,
    defaultValue: false,
    componentName: 'SelectablePill'
  })

  const pressed = useSharedValue(0)
  const selected = useSharedValue(isSelected ? 1 : 0)

  const handlePressIn = useCallback(() => {
    pressed.value = withTiming(1, motion.press)
    if (!isSelected) {
      selected.value = withTiming(1, motion.press)
    }
    setIsPressing(true)
  }, [pressed, motion.press, selected, setIsPressing, isSelected])

  const handleTouchCancel = useCallback(() => {
    pressed.value = withTiming(0, motion.press)
    if (!isSelected) {
      selected.value = withTiming(0, motion.press)
    }
    setIsPressing(false)
  }, [pressed, motion.press, selected, setIsPressing, isSelected])

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress?.(e)
      if (value) {
        onChange?.(value, !isSelected)
      }
      setIsPressing(false)
      setIsSelected(!isSelected)
    },
    [onChange, onPress, value, isSelected, setIsSelected]
  )

  useEffect(() => {
    setIsSelected(isSelectedProp)
    if (isSelectedProp) {
      selected.value = withTiming(1, motion.press)
    } else {
      selected.value = disableUnselectAnimation
        ? 0
        : withTiming(0, motion.press)
    }
  }, [
    isSelectedProp,
    motion.press,
    selected,
    setIsSelected,
    disableUnselectAnimation
  ])

  const animatedRootStyles = useAnimatedStyle(
    () => ({
      opacity: withTiming(disabled ? 0.45 : 1, motion.press),
      backgroundColor: interpolateColor(
        selected.value,
        [0, 1],
        [color.background.white, color.secondary.s400]
      ),
      borderColor: interpolateColor(
        selected.value,
        [0, 1],
        [color.border.strong, color.secondary.s400]
      ),
      transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.97]) }]
    }),
    [disabled, themeType]
  )

  const animatedTextStyles = useAnimatedStyle(
    () => ({
      color: interpolateColor(
        selected.value,
        [0, 1],
        [color.text.default, color.static.white]
      )
    }),
    [themeType]
  )

  return (
    <Pressable
      onPressIn={handlePressIn}
      onTouchCancel={handleTouchCancel}
      onPress={handlePress}
      hitSlop={DEFAULT_HIT_SLOP}
      style={[
        css({ alignSelf: 'flex-start', borderRadius: cornerRadius['2xl'] }),
        styleProp
      ]}
    >
      <AnimatedFlex
        accessibilityRole={type}
        accessibilityState={{
          checked: type === 'checkbox' ? isSelected : undefined,
          selected: type === 'radio' ? isSelected : undefined,
          disabled: !!disabled
        }}
        direction='row'
        gap='s'
        alignItems='center'
        justifyContent='center'
        alignSelf='flex-start'
        border='strong'
        borderRadius='2xl'
        h={size === 'small' ? 'xl' : '2xl'}
        ph={size === 'small' ? 'm' : 'l'}
        shadow={size === 'large' ? (isSelected ? 'flat' : 'near') : undefined}
        style={[animatedRootStyles, fullWidth ? { width: '100%' } : undefined]}
        {...other}
      >
        {size !== 'small' && Icon ? (
          <Icon
            size='s'
            color={isSelected || isPressing ? 'staticWhite' : 'default'}
          />
        ) : null}
        <AnimatedText
          numberOfLines={1}
          variant='body'
          style={[animatedTextStyles, { lineHeight: typography.lineHeight.m }]}
        >
          {label}
        </AnimatedText>
      </AnimatedFlex>
    </Pressable>
  )
}
