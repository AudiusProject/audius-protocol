import { createContext, memo, useContext } from 'react'

import { Nullable, SsrPageProps } from '@audius/common'

export type SsrContextType = {
  path: Nullable<string>
  isServerSide: boolean
  pageProps: SsrPageProps
}

export const useSsrContext = () => {
  return useContext(SsrContext)
}

export const SsrContext = createContext({
  path: null,
  isServerSide: true,
  pageProps: {}
} as SsrContextType)

export const SsrContextProvider = memo(
  (props: { value: SsrContextType; children: JSX.Element }) => {
    return (
      <SsrContext.Provider value={props.value}>
        {props.children}
      </SsrContext.Provider>
    )
  }
)
