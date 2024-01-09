import type { ReactNode, Ref } from 'react'
import { forwardRef, useCallback, useId, useRef } from 'react'

import { css } from '@emotion/native'
import type {
  NativeSyntheticEvent,
  TextInputChangeEventData,
  TextInputFocusEventData
} from 'react-native'
import { Platform, Pressable, TextInput as RNTextInput } from 'react-native'
import { Gesture, GestureDetector, State } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { useTheme } from '@audius/harmony-native'

import { useControlled } from '../../../hooks/useControlled'
import { useFocusState } from '../../../hooks/useFocusState'
import { mergeRefs } from '../../../utils/mergeRefs'
import type { TextColors, TextSize } from '../../Text/Text'
import { Text } from '../../Text/Text'
import { Flex } from '../../layout'

import { TextInputSize, type TextInputProps } from './types'

const AnimatedText = Animated.createAnimatedComponent(Text)
const AnimatedFlex = Animated.createAnimatedComponent(Flex)

export type TextInputRef = Ref<RNTextInput>

export const TextInput = forwardRef(
  (props: TextInputProps, ref: TextInputRef) => {
    const {
      'aria-label': ariaLabel,
      required,
      maxLength,
      showMaxLengthThreshold = 0.7,
      maxLengthWarningThreshold = 0.9,
      size = TextInputSize.DEFAULT,
      hideLabel,
      label: labelProp,
      value: valueProp,
      id: idProp,
      warning,
      error,
      disabled,
      onChange,
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      placeholder,
      helperText,
      startAdornmentText,
      endAdornmentText,
      startIcon: StartIcon,
      endIcon: EndIcon,
      endAdornment: endAdornmentProp,
      _incorrectError,
      _isFocused,
      _disablePointerEvents,
      ...other
    } = props

    // const value = valueProp
    const [value, setValueState] = useControlled({
      componentName: 'TextInput',
      controlledProp: valueProp,
      defaultValue: undefined,
      stateName: 'value'
    })

    const innerInputRef = useRef<RNTextInput>(null)

    const { typography, color, motion } = useTheme()

    let endAdornment: null | ReactNode
    if (EndIcon != null) {
      endAdornment = <EndIcon size='m' color='subdued' />
    } else if (endAdornmentProp != null) {
      endAdornment = endAdornmentProp
    } else {
      endAdornment = null
    }

    const focused = useSharedValue(_isFocused ? 1 : 0)

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        focused.value = withTiming(1, motion.press)
        onFocusProp?.(e)
      },
      [focused, motion.press, onFocusProp]
    )

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        focused.value = withTiming(0, motion.press)
        onBlurProp?.(e)
      },
      [focused, motion.press, onBlurProp]
    )

    const [isFocusedState, onFocus, onBlur] = useFocusState(
      handleFocus,
      handleBlur
    )

    const isFocused = _isFocused ?? isFocusedState

    // For focus behavior and accessiblity, <label> needs to have a htmlFor={} provided to an id matching the input
    const backupId = useId()
    const id = idProp ?? backupId

    const characterCount = value !== undefined ? `${value}`.length : 0
    const hasValue = characterCount > 0

    // Hide the label when requested or when the size is set to small
    const shouldShowLabel = !hideLabel && size !== TextInputSize.SMALL
    const labelText = required ? `${labelProp} *` : labelProp
    const placeholderText =
      required && hideLabel ? `${placeholder} *` : placeholder
    const helperTextSize: TextSize = size === TextInputSize.SMALL ? 'xs' : 's'

    // Whenever a label isn't visible the placeholder should be visible in it's place (if provided)
    const shouldShowPlaceholder = isFocused || !shouldShowLabel
    const shouldShowAdornments = isFocused || hasValue || !shouldShowLabel
    // Show the maxlength text whenever we hit a certain threshold (default 70%) + the input is focused
    const shouldShowMaxLengthText =
      isFocused &&
      maxLength &&
      characterCount >= showMaxLengthThreshold * maxLength
    // Turn the maxlength text to the warning color whenever we hit a certain threshold (default 90%)
    let maxLengthTextColor: TextColors = 'default'
    if (maxLength && characterCount > maxLength) {
      maxLengthTextColor = 'danger'
    } else if (
      maxLength &&
      characterCount >= maxLengthWarningThreshold * maxLength
    ) {
      maxLengthTextColor = 'warning'
    }

    const isSmall = size === TextInputSize.SMALL
    const statusColor = disabled
      ? 'subdued'
      : error
      ? 'danger'
      : warning || _incorrectError
      ? 'warning'
      : undefined

    const handlePressRoot = useCallback(() => {
      if (!isFocused) {
        innerInputRef.current?.focus()
      }
    }, [isFocused])

    const handleChange = useCallback(
      (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
        onChange?.(e)
        setValueState(e.nativeEvent.text)
      },
      [onChange, setValueState]
    )

    const tap = Gesture.Tap()
      .onBegin(() => {
        if (!isFocused) {
          focused.value = withTiming(1, motion.press)
        }
      })
      .onFinalize((event) => {
        if (event.state !== State.END && !isFocused) {
          focused.value = withTiming(0, motion.press)
        }
      })

    const animatedRootStyles = useAnimatedStyle(() => {
      const staticBorderColor = _isFocused
        ? color.secondary.s400
        : statusColor
        ? color.text[statusColor]
        : undefined

      return {
        borderColor:
          staticBorderColor ??
          interpolateColor(
            focused.value,
            [0, 1],
            [color.border.default, color.secondary.s400]
          )
      }
    })

    const animatedLabelStyle = useAnimatedStyle(() => ({
      fontSize: hasValue
        ? typography.size.s
        : interpolate(
            focused.value,
            [0, 1],
            [typography.size.m, typography.size.s]
          ),
      transform: [
        {
          translateY: hasValue ? 0 : interpolate(focused.value, [0, 1], [13, 0])
        }
      ]
    }))

    return (
      <Flex direction='column' gap='xs' alignItems='flex-start' w='100%'>
        <Pressable
          onPress={handlePressRoot}
          pointerEvents={disabled || _disablePointerEvents ? 'none' : undefined}
        >
          <GestureDetector gesture={tap}>
            <AnimatedFlex
              h={isSmall ? 34 : 64}
              w='100%'
              direction='row'
              alignItems='center'
              border='default'
              borderRadius='s'
              backgroundColor='surface1'
              ph='l'
              gap={isSmall ? 's' : 'm'}
              style={animatedRootStyles}
            >
              {StartIcon ? <StartIcon size='m' color='subdued' /> : null}
              <Flex
                direction='column'
                gap='xs'
                justifyContent='center'
                flex={1}
              >
                {shouldShowLabel ? (
                  <Flex
                    direction='row'
                    alignItems='center'
                    justifyContent='space-between'
                    gap='s'
                  >
                    <AnimatedText
                      nativeID={id}
                      variant='body'
                      color='subdued'
                      style={[
                        css({ overflow: 'hidden', zIndex: 2 }),
                        animatedLabelStyle
                      ]}
                      ellipsizeMode='tail'
                    >
                      {labelText}
                    </AnimatedText>
                    {shouldShowMaxLengthText ? (
                      <Text variant='body' size='xs' color={maxLengthTextColor}>
                        {characterCount}/{maxLength}
                      </Text>
                    ) : null}
                  </Flex>
                ) : null}

                <Flex
                  direction='row'
                  alignItems='center'
                  justifyContent='space-between'
                >
                  {startAdornmentText && shouldShowAdornments ? (
                    <Text
                      variant='label'
                      size='l'
                      color='subdued'
                      style={css({ lineHeight: 0 })}
                    >
                      {startAdornmentText}
                    </Text>
                  ) : null}
                  <RNTextInput
                    ref={mergeRefs([innerInputRef, ref])}
                    value={value}
                    accessibilityLabel={
                      Platform.OS === 'ios' ? labelProp : undefined
                    }
                    accessibilityLabelledBy={
                      Platform.OS === 'android' ? id : undefined
                    }
                    maxLength={maxLength}
                    placeholder={
                      shouldShowPlaceholder ? placeholderText : undefined
                    }
                    placeholderTextColor={
                      color.text[disabled ? 'subdued' : 'default']
                    }
                    underlineColorAndroid='transparent'
                    aria-label={ariaLabel ?? labelText}
                    style={css({
                      flex: 1,
                      fontSize: typography.size[isSmall ? 's' : 'l'],
                      color: color.text[disabled ? 'subdued' : 'default']
                    })}
                    onChange={handleChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    selectionColor={color.secondary.secondary}
                    {...other}
                  />
                  {endAdornmentText && shouldShowAdornments ? (
                    <Text
                      variant='label'
                      size='l'
                      color='subdued'
                      style={css({ lineHeight: 0 })}
                    >
                      {endAdornmentText}
                    </Text>
                  ) : null}
                </Flex>
              </Flex>
              {endAdornment}
            </AnimatedFlex>
          </GestureDetector>
        </Pressable>
        {helperText ? (
          <Text
            variant='body'
            size={helperTextSize}
            strength='default'
            color={statusColor ?? 'default'}
          >
            {helperText}
          </Text>
        ) : null}
      </Flex>
    )
  }
)
