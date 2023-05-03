import React, { useCallback, useEffect, useRef } from 'react'

import type { ViewStyle, StyleProp } from 'react-native'
import { Keyboard, Animated, Easing } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }
}))

type KeyboardAvoidingViewProps = {
  style: StyleProp<ViewStyle>
  heightOffsetRatio?: number
  keyboardShowingDuration?: number
  keyboardHidingDuration?: number
  // Offset is subtracted from the desired height when the keyboard is showing.
  keyboardShowingOffset?: number
  children: React.ReactNode
}

/**
 * Handrolled implementation of KeyboardAvoidingView. Allows
 * customization of the ratio of the keyboard height by which to translate
 * the content upwards (default 0.75), and the duration of the in/out animations.
 *
 * Mainly built to solve a bug with react-native default KeyboardAvoidingView
 * where the content inside the View would not translate upwards far enough.
 */
export const KeyboardAvoidingView = ({
  style,
  // 0.75 seems to work well but need to test on more screen sizes.
  heightOffsetRatio = 0.75,
  keyboardShowingDuration = 100,
  keyboardHidingDuration = 100,
  keyboardShowingOffset = 0,
  children
}: KeyboardAvoidingViewProps) => {
  const styles = useStyles()
  const keyboardHeight = useRef(new Animated.Value(0))

  const handleKeyboardWillShow = useCallback(
    (event) => {
      Animated.timing(keyboardHeight.current, {
        toValue:
          -event.endCoordinates.height * heightOffsetRatio +
          keyboardShowingOffset,
        duration: keyboardShowingDuration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      }).start()
    },
    [heightOffsetRatio, keyboardShowingDuration, keyboardShowingOffset]
  )

  const handleKeyboardWillHide = useCallback(
    (event) => {
      Animated.timing(keyboardHeight.current, {
        toValue: 0,
        duration: keyboardHidingDuration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true
      }).start()
    },
    [keyboardHidingDuration]
  )

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardWillShow',
      handleKeyboardWillShow
    )
    const hideSubscription = Keyboard.addListener(
      'keyboardWillHide',
      handleKeyboardWillHide
    )
    return () => {
      Keyboard.removeSubscription(showSubscription)
      Keyboard.removeSubscription(hideSubscription)
    }
  }, [handleKeyboardWillHide, handleKeyboardWillShow])

  return (
    <Animated.View
      style={[
        style,
        styles.rootContainer,
        {
          transform: [{ translateY: keyboardHeight.current }]
        }
      ]}
    >
      {children}
    </Animated.View>
  )
}
