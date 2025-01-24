import { ReactNode, useState } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider as ReduxProvider } from 'react-redux'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { LastLocationProvider } from 'react-router-last-location'
import { WagmiProvider } from 'wagmi'

import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/HeaderContextProvider'
import { NavProvider } from 'components/nav/mobile/NavContext'
import { ScrollProvider } from 'components/scroll-provider/ScrollProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { MainContentContextProvider } from 'pages/MainContentContext'
import { wagmiConfig } from 'services/audius-sdk/wagmi'
import { queryClient } from 'services/query-client'
import { configureStore } from 'store/configureStore'
import { getSystemAppearance, getTheme } from 'utils/theme/theme'

import { AppContextProvider } from './AppContextProvider'
import { AudiusQueryProvider } from './AudiusQueryProvider'
import { useHistoryContext } from './HistoryProvider'
import { SvgGradientProvider } from './SvgGradientProvider'
import { ThemeProvider } from './ThemeProvider'

type AppProvidersProps = {
  children: ReactNode
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  const { history } = useHistoryContext()
  const isMobile = useIsMobile()

  const [{ store, storeHistory }] = useState(() => {
    const initialStoreState = {
      ui: {
        theme: {
          theme: getTheme(),
          systemAppearance: getSystemAppearance()
        }
      }
    }

    const { store, history: storeHistory } = configureStore(
      history,
      isMobile,
      initialStoreState
    )
    // Mount store to window for easy access
    if (typeof window !== 'undefined' && !window.store) {
      window.store = store
    }
    return { store, storeHistory }
  })

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ReduxProvider store={store}>
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
                                  <SvgGradientProvider>
                                    {children}
                                  </SvgGradientProvider>
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
        </ReduxProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
