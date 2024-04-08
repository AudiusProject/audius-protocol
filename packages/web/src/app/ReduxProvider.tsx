import { ReactNode, useRef } from 'react'

import { Provider } from 'react-redux'
import { Persistor, persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'

import { useIsMobile } from 'hooks/useIsMobile'
import { configureStore } from 'store/configureStore'
import { AppState } from 'store/types'
import logger from 'utils/logger'

import { useSsrContext } from '../ssr/SsrContext'

import { useHistoryContext } from './HistoryProvider'
import { AppState } from 'store/types'

export const ReduxProvider = ({
  children,
  initialStoreState
}: {
  children: ReactNode
  // Optional (for testing purposes) - sets up an initial store state
  initialStoreState?: Partial<AppState>
}) => {
  const { pageProps, isServerSide } = useSsrContext()
  const { history } = useHistoryContext()
  const isMobile = useIsMobile()

  const storeRef = useRef<ReturnType<typeof configureStore>>()
  const persistorRef = useRef<Persistor>()

  if (!storeRef.current) {
    const store = configureStore(
      history,
      isMobile,
      pageProps,
      isServerSide,
      initialStoreState
    )
    storeRef.current = store
    const persistor = persistStore(store)
    persistorRef.current = persistor

    // Mount store to window for easy access
    if (typeof window !== 'undefined') {
      window.store = store
    }

    // Set up logger on store
    if (!isServerSide) {
      logger(store)
    }
  }

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistorRef.current!}>
        {() => children}
      </PersistGate>
    </Provider>
  )
}
