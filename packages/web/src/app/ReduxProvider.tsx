import { ReactNode, useState } from 'react'

import { Provider } from 'react-redux'
import { persistStore } from 'redux-persist'

import { configureStore } from 'store/configureStore'
import logger from 'utils/logger'

import { useSsrContext } from '../ssr/SsrContext'

import { useHistoryContext } from './HistoryProvider'

// TODO: Figure out persist gate? Do we need to block on loading from localstorage?
export const ReduxProvider = ({ children }: { children: ReactNode }) => {
  const { isServerSide, pageProps } = useSsrContext()
  const { history } = useHistoryContext()

  const [store, setStore] = useState<ReturnType<typeof configureStore>>()

  if (!store) {
    const store = configureStore(history, pageProps)
    setStore(store)
    persistStore(store)

    // Mount store to window for easy access
    if (typeof window !== 'undefined') {
      window.store = store
    }

    // Set up logger on store
    logger(store)
  }

  return store ? <Provider store={store}>{children}</Provider> : null
}
