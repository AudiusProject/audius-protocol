import { useCallback, useRef } from 'react'

import { Animated } from 'react-native'

export const usePressScaleAnimation = (scaleTo = 0.97) => {
  const scale = useRef(new Animated.Value(1)).current

  const startPress = useCallback(() => {
    Animated.timing(scale, {
      toValue: scaleTo,
      duration: 70,
      delay: 0,
      useNativeDriver: true
    }).start()
  }, [scale, scaleTo])

  const releasePress = useCallback(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 70,
      delay: 0,
      useNativeDriver: true
    }).start()
  }, [scale])

  return { scale, handlePressIn: startPress, handlePressOut: releasePress }
}
