import { useCallback, useRef } from 'react'

import { Animated } from 'react-native'

const convertHexToRGBA = (hexCode, opacity = 1) => {
  let hex = hexCode.replace('#', '')

  if (hex.length === 3) {
    hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
  }

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  /* Backward compatibility for whole number based opacity values. */
  if (opacity > 1 && opacity <= 100) {
    opacity = opacity / 100
  }

  return `rgba(${r},${g},${b},${1})`
}

export const useColorAnimation = (...colors: string[]) => {
  const colorAnim = useRef(new Animated.Value(0)).current

  const handlePressIn = useCallback(() => {
    Animated.timing(colorAnim, {
      toValue: 1,
      duration: 70,
      delay: 0,
      useNativeDriver: false
    }).start()
  }, [colorAnim])

  const handlePressOut = useCallback(() => {
    Animated.timing(colorAnim, {
      toValue: 0,
      duration: 70,
      delay: 0,
      useNativeDriver: false
    }).start()
  }, [colorAnim])

  const color = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: colors.map((color) => convertHexToRGBA(color))
  })

  return {
    color,
    handlePressIn,
    handlePressOut
  }
}
