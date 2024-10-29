import type { ReactNode } from 'react'

import { useScreenContext } from './ScreenContextProvider'
export const ScreenSecondaryContent = ({
  children,
  skeleton
}: {
  children: ReactNode
  skeleton?: ReactNode
}) => {
  const { isPrimaryContentReady } = useScreenContext()
  if (!isPrimaryContentReady) return <>{skeleton ?? null}</>
  return <>{children}</>
}
