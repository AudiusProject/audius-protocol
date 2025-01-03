import { ReactNode } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Provider as ReduxProvider } from 'react-redux'
import { Router } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { LastLocationProvider } from 'react-router-last-location'

import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/HeaderContextProvider'
import { NavProvider } from 'components/nav/mobile/NavContext'
import { ScrollProvider } from 'components/scroll-provider/ScrollProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { queryClient } from 'services/query-client'
import { configureStore } from 'store/configureStore'

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
  const { store, history: storeHistory } = configureStore(history, isMobile)

  return (
    <QueryClientProvider client={queryClient}>
      <ReduxProvider store={store}>
        <Router history={storeHistory}>
          <CompatRouter>
            <LastLocationProvider>
              <RouterContextProvider>
                <HeaderContextProvider>
                  <NavProvider>
                    <ScrollProvider>
                      <ToastContextProvider>
                        <AppContextProvider>
                          <AudiusQueryProvider>
                            <ThemeProvider>
                              <SvgGradientProvider>
                                {children}
                              </SvgGradientProvider>
                            </ThemeProvider>
                          </AudiusQueryProvider>
                        </AppContextProvider>
                      </ToastContextProvider>
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
  )
}
