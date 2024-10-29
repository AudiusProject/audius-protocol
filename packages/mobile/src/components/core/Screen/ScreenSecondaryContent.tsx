import type { ReactNode } from 'react'

import { useScreenContext } from './hooks/useScreenContext'

export const ScreenSecondaryContent = ({
  children
}: {
  children: ReactNode
}) => {
  const { isPrimaryContentReady } = useScreenContext()
  if (!isPrimaryContentReady) return null
  return children
}
