import { useCallback, useRef } from 'react'

import { Animated } from 'react-native'

export const usePressScaleAnimation = (
  scaleTo = 0.97,
  useNativeDriver = true
) => {
  const scale = useRef(new Animated.Value(1)).current

  const startPress = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleTo,
      stiffness: 500,
      damping: 1,
      overshootClamping: true,
      useNativeDriver
    }).start()
  }, [scale, scaleTo, useNativeDriver])

  const releasePress = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      stiffness: 200,
      damping: 10,
      overshootClamping: true,
      useNativeDriver
    }).start()
  }, [scale, useNativeDriver])

  return {
    scale,
    handlePressIn: startPress,
    handlePressOut: releasePress
  }
}
