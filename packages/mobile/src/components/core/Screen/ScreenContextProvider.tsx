import type { ReactNode } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'

import { useIsScreenReady } from './hooks/useIsScreenReady'
import type { ScreenContextType } from './types'

export const ScreenContext = createContext<ScreenContextType>({
  isScreenReady: false,
  isPrimaryContentReady: false,
  setIsPrimaryContentReady: () => {}
})

export const ScreenContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [isPrimaryContentReady, setIsPrimaryContentReady] = useState(false)
  const isScreenReady = useIsScreenReady()

  const context = useMemo(() => {
    return { isScreenReady, isPrimaryContentReady, setIsPrimaryContentReady }
  }, [isScreenReady, isPrimaryContentReady])

  return (
    <ScreenContext.Provider value={context}>{children}</ScreenContext.Provider>
  )
}

export const useScreenContext = () => {
  const context = useContext(ScreenContext)
  if (!context) {
    throw new Error(
      'useScreenContext must be used within a ScreenContextProvider'
    )
  }
  return context
}
