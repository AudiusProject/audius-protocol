import type { ReactNode } from 'react'

import Animated, { Easing, FadeIn } from 'react-native-reanimated'

type FadeInViewProps = {
  children: ReactNode
}

const fadeInConfig = FadeIn.easing(Easing.ease)
  .withInitialValues({
    opacity: 0.3
  })
  .duration(1000)

export const FadeInView = (props: FadeInViewProps) => {
  const { children } = props

  return <Animated.View entering={fadeInConfig}>{children}</Animated.View>
}
