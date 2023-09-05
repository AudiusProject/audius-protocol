import { useCallback, useRef } from 'react'

import { Animated } from 'react-native'

export const usePressScaleAnimation = (
  scaleTo = 0.97,
  useNativeDriver = true
) => {
  const scale = useRef(new Animated.Value(1)).current

  const startPress = useCallback(() => {
    Animated.timing(scale, {
      toValue: scaleTo,
      duration: 70,
      delay: 0,
      useNativeDriver
    }).start()
  }, [scale, scaleTo, useNativeDriver])

  const releasePress = useCallback(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 70,
      delay: 0,
      useNativeDriver
    }).start()
  }, [scale, useNativeDriver])

  return {
    scale,
    handlePressIn: startPress,
    handlePressOut: releasePress
  }
}
