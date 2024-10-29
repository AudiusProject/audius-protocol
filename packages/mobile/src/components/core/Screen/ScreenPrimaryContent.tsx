import { useEffect, type ReactNode } from 'react'

import { useScreenContext } from './ScreenContextProvider'

type ScreenPrimaryContentProps = {
  children: ReactNode
  skeleton?: ReactNode
}

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
