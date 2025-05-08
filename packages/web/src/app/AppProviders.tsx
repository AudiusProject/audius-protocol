import { ReactNode, useState } from 'react'

import { MediaProvider } from '@audius/harmony/src/contexts'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider as ReduxProvider } from 'react-redux'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { LastLocationProvider } from 'react-router-last-location'
import { PersistGate } from 'redux-persist/integration/react'
import { WagmiProvider } from 'wagmi'

import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/HeaderContextProvider'
import { NavProvider } from 'components/nav/mobile/NavContext'
import { ScrollProvider } from 'components/scroll-provider/ScrollProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { MainContentContextProvider } from 'pages/MainContentContext'
import { queryClient } from 'services/query-client'
import { configureStore } from 'store/configureStore'
import { getSystemAppearance, getTheme } from 'utils/theme/theme'

import { AppContextProvider } from './AppContextProvider'
import { AudiusQueryProvider } from './AudiusQueryProvider'
import { useHistoryContext } from './HistoryProvider'
import { wagmiAdapter } from './ReownAppKitModal'
import { ThemeProvider } from './ThemeProvider'

type AppProvidersProps = {
  children: ReactNode
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  const { history } = useHistoryContext()
  const isMobile = useIsMobile()

  const [{ store, storeHistory, persistor }] = useState(() => {
    const initialStoreState = {
      ui: {
        theme: {
          theme: getTheme(),
          systemAppearance: getSystemAppearance()
        }
      }
    }

    const {
      store,
      history: storeHistory,
      persistor
    } = configureStore(history, isMobile, initialStoreState)
    // Mount store to window for easy access
    if (typeof window !== 'undefined' && !window.store) {
      window.store = store
    }
    return { store, storeHistory, persistor }
  })

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MediaProvider>
          <ReduxProvider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <Router history={storeHistory}>
                <CompatRouter>
                  <LastLocationProvider>
                    <RouterContextProvider>
                      <HeaderContextProvider>
                        <NavProvider>
                          <ScrollProvider>
                            <ThemeProvider>
                              <ToastContextProvider>
                                <AppContextProvider>
                                  <AudiusQueryProvider>
                                    <MainContentContextProvider>
                                      {children}
                                    </MainContentContextProvider>
                                  </AudiusQueryProvider>
                                </AppContextProvider>
                              </ToastContextProvider>
                            </ThemeProvider>
                          </ScrollProvider>
                        </NavProvider>
                      </HeaderContextProvider>
                    </RouterContextProvider>
                  </LastLocationProvider>
                </CompatRouter>
              </Router>
            </PersistGate>
          </ReduxProvider>
        </MediaProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
