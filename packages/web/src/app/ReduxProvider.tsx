import { ReactNode, useState } from 'react'

import { Provider } from 'react-redux'
import { Persistor, persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'

import { useIsMobile } from 'hooks/useIsMobile'
import { configureStore } from 'store/configureStore'
import logger from 'utils/logger'

import { useSsrContext } from '../ssr/SsrContext'

import { useHistoryContext } from './HistoryProvider'

export const ReduxProvider = ({ children }: { children: ReactNode }) => {
  const { pageProps, isServerSide } = useSsrContext()
  const { history } = useHistoryContext()
  const isMobile = useIsMobile()

  const [store, setStore] = useState<ReturnType<typeof configureStore>>()
  const [persistor, setPersistor] = useState<Persistor>()

  if (!store) {
    const store = configureStore(history, isMobile, pageProps, isServerSide)
    setStore(store)
    const persistor = persistStore(store)
    setPersistor(persistor)

    // Mount store to window for easy access
    if (typeof window !== 'undefined') {
      window.store = store
    }

    // Set up logger on store
    if (!isServerSide) {
      logger(store)
    }
  }

  return store && persistor ? (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {() => children}
      </PersistGate>
    </Provider>
  ) : null
}
