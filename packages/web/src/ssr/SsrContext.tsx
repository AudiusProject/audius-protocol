import { createContext, memo, useContext } from 'react'

import { Nullable, SsrPageProps } from '@audius/common'
import { History } from 'history'

export type SsrContextType = {
  path: Nullable<string>
  isServerSide: boolean
  /**
   * The page props for the current request. This is available on both the server and the client.
   */
  pageProps: SsrPageProps
  /**
   * The history object for the current request. This is only available on the server.
   * On the client, use useHistoryContext instead.
   */
  history: Nullable<History>
}

export const useSsrContext = () => {
  return useContext(SsrContext)
}

export const SsrContext = createContext<SsrContextType>({
  path: null,
  isServerSide: false,
  pageProps: {},
  history: null
})

export const SsrContextProvider = memo(
  (props: { value: SsrContextType; children: JSX.Element }) => {
    return (
      <SsrContext.Provider value={props.value}>
        {props.children}
      </SsrContext.Provider>
    )
  }
)
