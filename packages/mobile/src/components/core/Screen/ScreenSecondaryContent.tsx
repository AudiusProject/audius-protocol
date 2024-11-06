import type { ReactNode } from 'react'

import Animated, { FadeIn } from 'react-native-reanimated'

import { useScreenContext } from './ScreenContextProvider'

type ScreenSecondaryContentProps = {
  children: ReactNode
  skeleton?: ReactNode
}

/**
 * ScreenSecondaryContent is a wrapper that ensures the secondary content is only
 * rendered after any ScreenPrimaryContent within the same Screen component is ready
 *
 * _Note: ScreenSecondaryContent should not be used outside of a Screen component
 *   or in a Screen without a ScreenPrimaryContent_
 */
export const ScreenSecondaryContent = (props: ScreenSecondaryContentProps) => {
  const { children, skeleton } = props
  const { isPrimaryContentReady } = useScreenContext()

  return isPrimaryContentReady ? (
    <Animated.View entering={FadeIn} style={{ flex: 1 }}>
      {children}
    </Animated.View>
  ) : (
    <>{skeleton ?? null}</>
  )
}
