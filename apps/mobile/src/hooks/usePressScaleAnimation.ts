import { useCallback, useRef } from 'react'

import { Animated } from 'react-native'

export const usePressScaleAnimation = (
  scaleTo = 0.97,
  useNativeDriver = true
) => {
  const scaleAnim = useRef(new Animated.Value(1))

  const startPress = useCallback(() => {
    if (scaleTo === null) return
    Animated.spring(scaleAnim.current, {
      toValue: scaleTo,
      stiffness: 500,
      damping: 1,
      overshootClamping: true,
      useNativeDriver
    }).start()
  }, [scaleTo, useNativeDriver])

  const releasePress = useCallback(() => {
    if (scaleTo === null) return
    Animated.spring(scaleAnim.current, {
      toValue: 1,
      stiffness: 200,
      damping: 10,
      overshootClamping: true,
      useNativeDriver
    }).start()
  }, [scaleTo, useNativeDriver])

  return {
    scale: scaleAnim.current,
    handlePressIn: startPress,
    handlePressOut: releasePress
  }
}
