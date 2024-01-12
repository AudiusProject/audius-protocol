import { createContext, memo, useContext } from 'react'

import { Nullable, SsrPageProps } from '@audius/common'
import { History } from 'history'

export type SsrContextType = {
  path: Nullable<string>
  /**
   * Is the app being rendered on the server
   */
  isServerSide: boolean
  /**
   * Is SSR enabled
   * If so, this will be true on both the server and the client
   */
  isSsrEnabled: boolean
  isMobile: boolean
  /**
   * The page props for the current request. This is available on both the server and the client.
   * For example, this can contain track data for rendering the track page
   */
  pageProps: SsrPageProps
  /**
   * The history object for the current request. This is only available on the server.
   * Use useHistoryContext to access the history object on the client.
   */
  history: Nullable<History>
}

export const useSsrContext = () => {
  return useContext(SsrContext)
}

/**
 * Context provider for the SSR data
 */
export const SsrContext = createContext<SsrContextType>({
  path: null,
  isServerSide: false,
  isSsrEnabled: false,
  isMobile: false,
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
