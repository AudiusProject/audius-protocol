import { ReactNode } from 'react'

import {
  QueryClientProvider,
  QueryClient as TanQueryClient
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConnectedRouter } from 'connected-react-router'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { LastLocationProvider } from 'react-router-last-location'

import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/HeaderContextProvider'
import { NavProvider } from 'components/nav/mobile/NavContext'
import { ScrollProvider } from 'components/scroll-provider/ScrollProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { getSystemAppearance, getTheme } from 'utils/theme/theme'

import { MainContentContextProvider } from '../pages/MainContentContext'

import { AppContextProvider } from './AppContextProvider'
import { AudiusQueryProvider } from './AudiusQueryProvider'
import { useHistoryContext } from './HistoryProvider'
import { ReduxProvider } from './ReduxProvider'
import { SvgGradientProvider } from './SvgGradientProvider'
import { ThemeProvider } from './ThemeProvider'

const tanQueryClient = new TanQueryClient()

type AppContextProps = {
  children: ReactNode
}

export const AppProviders = ({ children }: AppContextProps) => {
  const { history } = useHistoryContext()

  const initialStoreState = {
    ui: {
      theme: {
        theme: getTheme(),
        systemAppearance: getSystemAppearance()
      }
    }
  }

  return (
    <ReduxProvider initialStoreState={initialStoreState}>
      <ConnectedRouter history={history}>
        <CompatRouter>
          <LastLocationProvider>
            <AudiusQueryProvider>
              <QueryClientProvider client={tanQueryClient}>
                <ReactQueryDevtools initialIsOpen={false} />
                <AppContextProvider>
                  <ThemeProvider>
                    <NavProvider>
                      <ScrollProvider>
                        <RouterContextProvider>
                          <MainContentContextProvider>
                            <SvgGradientProvider>
                              <HeaderContextProvider>
                                <ToastContextProvider>
                                  {children}
                                </ToastContextProvider>
                              </HeaderContextProvider>
                            </SvgGradientProvider>
                          </MainContentContextProvider>
                        </RouterContextProvider>
                      </ScrollProvider>
                    </NavProvider>
                  </ThemeProvider>
                </AppContextProvider>
              </QueryClientProvider>
            </AudiusQueryProvider>
          </LastLocationProvider>
        </CompatRouter>
      </ConnectedRouter>
    </ReduxProvider>
  )
}
