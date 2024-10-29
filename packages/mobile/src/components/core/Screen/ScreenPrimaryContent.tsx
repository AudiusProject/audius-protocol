import { useEffect, type ReactNode } from 'react'

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
    requestAnimationFrame(() => {
      setIsPrimaryContentReady(true)
    })
  }, [isScreenReady, setIsPrimaryContentReady])

  return isScreenReady ? <>{children}</> : <>{skeleton ?? null}</>
}
