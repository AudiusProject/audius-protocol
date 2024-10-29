import { useEffect, type ReactNode } from 'react'

import { useScreenContext } from './ScreenContextProvider'
export const ScreenPrimaryContent = ({
  children,
  skeleton
}: {
  children: ReactNode
  skeleton?: ReactNode
}) => {
  const { isScreenReady, setIsPrimaryContentReady } = useScreenContext()
  useEffect(() => {
    if (!isScreenReady) return
    requestAnimationFrame(() => {
      setIsPrimaryContentReady(true)
    })
  }, [isScreenReady, setIsPrimaryContentReady])

  return isScreenReady ? <>{children}</> : <>{skeleton ?? null}</>
}
