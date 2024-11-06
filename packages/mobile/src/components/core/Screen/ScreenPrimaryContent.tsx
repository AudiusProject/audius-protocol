import { useEffect, type ReactNode } from 'react'

import { Platform } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { useScreenContext } from './ScreenContextProvider'

type ScreenPrimaryContentProps = {
  children: ReactNode
  skeleton?: ReactNode
}

/**
 * ScreenPrimaryContent is a wrapper that ensures the primary content is only rendered
 * after the screen is ready and blocks any ScreenSecondaryContent from rendering until
 * the PrimaryContent is ready
 *
 * _Note: ScreenPrimaryContent should not be used outside of a Screen component_
 */
export const ScreenPrimaryContent = (props: ScreenPrimaryContentProps) => {
  const { children, skeleton } = props
  const { isScreenReady, setIsPrimaryContentReady } = useScreenContext()

  useEffect(() => {
    if (!isScreenReady) return
    setIsPrimaryContentReady(true)
  }, [isScreenReady, setIsPrimaryContentReady])

  return isScreenReady ? (
    <Animated.View entering={Platform.OS === 'ios' ? FadeIn : undefined}>
      {children}
    </Animated.View>
  ) : (
    <>{skeleton ?? null}</>
  )
}
