import { ReactNode, useRef } from 'react'

import { Provider } from 'react-redux'
import { Persistor, persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'
import { PartialDeep } from 'type-fest'

import { useIsMobile } from 'hooks/useIsMobile'
import { configureStore } from 'store/configureStore'
import { AppState } from 'store/types'
import logger from 'utils/logger'

import { useSsrContext } from '../ssr/SsrContext'

import { useHistoryContext } from './HistoryProvider'

type ReduxProviderProps = {
  children: ReactNode
  // Sets up an initial store state
  initialStoreState?: PartialDeep<AppState>
}

export const ReduxProvider = (props: ReduxProviderProps) => {
  const { children, initialStoreState } = props
  const { isServerSide } = useSsrContext()
  const { history } = useHistoryContext()
  const isMobile = useIsMobile()

  const storeRef = useRef<ReturnType<typeof configureStore>>()
  const persistorRef = useRef<Persistor>()

  if (!storeRef.current) {
    const store = configureStore(history, isMobile, initialStoreState)
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
