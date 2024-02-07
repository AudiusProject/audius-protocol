import { createContext, memo, useContext } from 'react'

import { SsrPageProps } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { History } from 'history'

import { isMobile as isMobileClient } from 'utils/clientUtil'

export type SsrContextType = {
  /**
   * Is the app being rendered on the server
   */
  isServerSide: boolean
  /**
   * Is SSR enabled
   * If so, this will be true on both the server and the client
   */
  isSsrEnabled: boolean
  /**
   * Is the app being rendered for a mobile device
   */
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
  isServerSide: false,
  isSsrEnabled: false,
  isMobile: false,
  pageProps: {},
  history: null
})

export const SsrContextProvider = memo(
  (props: { value: SsrContextType; children: JSX.Element }) => {
    const isMobile = props.value.isServerSide
      ? props.value.isMobile
      : isMobileClient()

    return (
      <SsrContext.Provider value={{ ...props.value, isMobile }}>
        {props.children}
      </SsrContext.Provider>
    )
  }
)
