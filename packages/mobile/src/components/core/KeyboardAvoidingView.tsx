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
  style?: StyleProp<ViewStyle>
  keyboardShowingDuration?: number
  keyboardHidingDuration?: number
  // Offset is subtracted from the desired height when the keyboard is showing.
  keyboardShowingOffset?: number
  onKeyboardShow?: () => void
  onKeyboardHide?: () => void
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
  keyboardShowingDuration = 350,
  keyboardHidingDuration = 250,
  keyboardShowingOffset = 0,
  onKeyboardShow,
  onKeyboardHide,
  children
}: KeyboardAvoidingViewProps) => {
  const styles = useStyles()
  const keyboardHeight = useRef(new Animated.Value(0))

  const handleKeyboardWillShow = useCallback(
    (event) => {
      Animated.timing(keyboardHeight.current, {
        toValue: -event.endCoordinates.height + keyboardShowingOffset,
        duration: keyboardShowingDuration,
        // Ease out to start animation fast and settle slowly
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start(onKeyboardShow)
    },
    [keyboardShowingDuration, keyboardShowingOffset, onKeyboardShow]
  )

  const handleKeyboardWillHide = useCallback(
    (event) => {
      Animated.timing(keyboardHeight.current, {
        toValue: 0,
        duration: keyboardHidingDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start(onKeyboardHide)
    },
    [keyboardHidingDuration, onKeyboardHide]
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
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [handleKeyboardWillHide, handleKeyboardWillShow])

  return (
    <Animated.View
      style={[
        styles.rootContainer,
        style,
        {
          transform: [{ translateY: keyboardHeight.current }]
        }
      ]}
    >
      {children}
    </Animated.View>
  )
}
