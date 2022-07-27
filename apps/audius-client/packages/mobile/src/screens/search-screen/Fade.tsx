import type { ReactElement } from 'react'
import { useEffect, useRef } from 'react'

import { Animated } from 'react-native'

type FadeProps = {
  in: boolean
  children: ReactElement
}
export const Fade = ({ in: inProp, children }: FadeProps) => {
  const fadeAnimation = useRef(new Animated.Value(inProp ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(fadeAnimation, {
      toValue: inProp ? 1 : 0,
      duration: 10000,
      useNativeDriver: true
    }).start()
  }, [fadeAnimation, inProp])

  return (
    <Animated.View style={{ opacity: fadeAnimation }}>{children}</Animated.View>
  )
}
