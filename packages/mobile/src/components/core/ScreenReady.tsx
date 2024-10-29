import type { ReactNode } from 'react'

import Animated, { FadeIn } from 'react-native-reanimated'
import { usePrevious } from 'react-use'

import { useScreenContext } from './Screen/ScreenContextProvider'
export const ScreenReady = ({
  loadingComponent = null,
  children
}: {
  loadingComponent?: ReactNode
  children: ReactNode
}) => {
  const { isScreenReady } = useScreenContext()
  const wasReady = usePrevious(isScreenReady)
  return isScreenReady ? (
    <Animated.View entering={wasReady ? FadeIn : undefined}>
      {children}
    </Animated.View>
  ) : (
    <>{loadingComponent}</>
  )
}
