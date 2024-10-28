import type { ReactNode } from 'react'

import Animated, { FadeIn } from 'react-native-reanimated'
import { usePrevious } from 'react-use'

import { useIsScreenReady } from 'app/hooks/useIsScreenReady'

export const ScreenReady = ({
  loadingComponent = null,
  children
}: {
  loadingComponent?: ReactNode
  children: ReactNode
}) => {
  const isReady = useIsScreenReady()
  const wasReady = usePrevious(isReady)
  return isReady ? (
    <Animated.View entering={wasReady ? FadeIn : undefined}>
      {children}
    </Animated.View>
  ) : (
    <>{loadingComponent}</>
  )
}
