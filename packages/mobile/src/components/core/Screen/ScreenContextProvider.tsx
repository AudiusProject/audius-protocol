import type { ReactNode } from 'react'
import { createContext, useState } from 'react'

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
  return (
    <ScreenContext.Provider
      value={{ isScreenReady, isPrimaryContentReady, setIsPrimaryContentReady }}
    >
      {children}
    </ScreenContext.Provider>
  )
}
