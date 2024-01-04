import React, { useCallback, useEffect, useState } from 'react'

import { cornerRadius } from '@audius/harmony'
import { css } from '@emotion/native'
import { Pressable } from 'react-native'
import type { GestureResponderEvent } from 'react-native'
import { Gesture, GestureDetector, State } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { useTheme } from '../../../foundations/theme'
import { Text } from '../../Text/Text'
import { Flex } from '../../layout'

import type { SelectablePillProps } from './types'

const AnimatedFlex = Animated.createAnimatedComponent(Flex)
const AnimatedText = Animated.createAnimatedComponent(Text)

export const SelectablePill = (props: SelectablePillProps) => {
  const {
    icon: Icon,
    label,
    size = 'small',
    isSelected: isSelectedProp,
    disabled,
    onPress,
    ...other
  } = props
  const { color, motion } = useTheme()
  const pressed = useSharedValue(0)
  const selected = useSharedValue(0)
  const [isPressing, setIsPressing] = useState(false)
  const [isSelected, setIsSelected] = useState(isSelectedProp)

  const handlePressIn = useCallback(() => {
    setIsPressing(true)
  }, [])

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress?.(e)
      setIsPressing(false)
      setIsSelected((isSelected) => !isSelected)
    },
    [onPress]
  )

  const tap = Gesture.Tap()
    .shouldCancelWhenOutside(true)
    .onBegin(() => {
      pressed.value = withTiming(1, motion.hover)
      if (!isSelected) {
        selected.value = withTiming(1, motion.hover)
      }
    })
    .onFinalize((event) => {
      pressed.value = withTiming(0, motion.press)
      const isDeselect = event.state === State.END && isSelected
      const isCancel = event.state !== State.END && !isSelected
      if (isDeselect || isCancel) {
        selected.value = withTiming(0, motion.press)
      }
    })

  useEffect(() => {
    setIsSelected(isSelectedProp)
    selected.value = withTiming(isSelectedProp ? 1 : 0, motion.press)
  }, [isSelectedProp, motion.press, selected])

  const animatedRootStyles = useAnimatedStyle(() => ({
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
  }))

  const animatedTextStyles = useAnimatedStyle(() => ({
    color: interpolateColor(
      selected.value,
      [0, 1],
      [color.text.default, color.static.white]
    )
  }))

  return (
    <GestureDetector gesture={tap}>
      <Pressable
        onPressIn={handlePressIn}
        onPress={handlePress}
        style={css({
          alignSelf: 'flex-start',
          borderRadius: cornerRadius['2xl']
        })}
      >
        <AnimatedFlex
          direction='row'
          gap='xs'
          alignItems='center'
          justifyContent='center'
          alignSelf='flex-start'
          border='strong'
          borderRadius='2xl'
          h={size === 'small' ? 'xl' : '2xl'}
          ph={size === 'small' ? 'm' : 'l'}
          shadow={size === 'large' ? (isSelected ? 'flat' : 'near') : undefined}
          style={animatedRootStyles}
          {...other}
        >
          {Icon ? (
            <Icon
              size='xs'
              fill={
                isSelected || isPressing
                  ? color.text.staticWhite
                  : color.text.default
              }
            />
          ) : null}
          <AnimatedText
            numberOfLines={1}
            variant='body'
            style={animatedTextStyles}
          >
            {label}
          </AnimatedText>
        </AnimatedFlex>
      </Pressable>
    </GestureDetector>
  )
}
