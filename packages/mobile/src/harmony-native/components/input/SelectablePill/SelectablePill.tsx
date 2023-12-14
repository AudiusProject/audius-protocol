import React, { useCallback, useEffect, useState } from 'react'

import { cornerRadius } from '@audius/harmony'
import { css } from '@emotion/native'
import { Pressable } from 'react-native'
import type { GestureResponderEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
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

const animationConfig = {
  duration: 120,
  easing: Easing.bezier(0.44, 0, 0.56, 1)
}

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
  const { color } = useTheme()
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
    .onBegin(() => {
      pressed.value = withTiming(1, animationConfig)
      if (!isSelected) {
        selected.value = withTiming(1, animationConfig)
      }
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, animationConfig)
      if (isSelected) {
        selected.value = withTiming(0, animationConfig)
      }
    })

  const longPress = Gesture.LongPress()
    .minDuration(animationConfig.duration)
    .onBegin(() => {
      pressed.value = withTiming(1, animationConfig)
      if (!isSelected) {
        selected.value = withTiming(1, animationConfig)
      }
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, animationConfig)
      if (isSelected) {
        selected.value = withTiming(0, animationConfig)
      }
    })

  const taps = Gesture.Exclusive(longPress, tap)

  useEffect(() => {
    setIsSelected(isSelectedProp)
    selected.value = withTiming(isSelectedProp ? 1 : 0, animationConfig)
  }, [isSelectedProp, selected])

  const animatedRootStyles = useAnimatedStyle(() => ({
    opacity: withTiming(disabled ? 0.45 : 1, animationConfig),
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
    <GestureDetector gesture={taps}>
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
