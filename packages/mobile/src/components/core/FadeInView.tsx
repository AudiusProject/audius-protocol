import type { ReactNode } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import Animated, { Easing, FadeIn } from 'react-native-reanimated'

type FadeInViewProps = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  startOpacity?: number
  duration?: number
}

export const FadeInView = (props: FadeInViewProps) => {
  const { children, style, startOpacity = 0.3, duration = 1000 } = props

  const fadeInConfig = FadeIn.easing(Easing.ease)
    .withInitialValues({
      opacity: startOpacity
    })
    .duration(duration)

  return (
    <Animated.View entering={fadeInConfig} style={style}>
      {children}
    </Animated.View>
  )
}
