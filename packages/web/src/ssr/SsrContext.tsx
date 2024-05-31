import { createContext, useContext } from 'react'

import { isMobile as isMobileClient } from 'utils/clientUtil'

export type SsrContextType = {
  /**
   * Is the app being rendered on the server
   */
  isServerSide: boolean
  /**
   * Is the app being rendered for a mobile device
   */
  isMobile: boolean
}

export const useSsrContext = () => {
  return useContext(SsrContext)
}

/**
 * Context provider for the SSR data
 */
export const SsrContext = createContext<SsrContextType>({
  isServerSide: false,
  isMobile: false
})

type SsrContextProviderProps = {
  value: SsrContextType
  children: JSX.Element
}

export const SsrContextProvider = (props: SsrContextProviderProps) => {
  const { value, children } = props
  const isMobile = value.isServerSide ? value.isMobile : isMobileClient()

  return (
    <SsrContext.Provider value={{ ...value, isMobile }}>
      {children}
    </SsrContext.Provider>
  )
}
