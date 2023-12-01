import { ReactNode } from 'react'

import { ConnectedRouter } from 'connected-react-router'
import { LastLocationProvider } from 'react-router-last-location'

import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/HeaderContextProvider'
import { NavProvider } from 'components/nav/store/context'
import { ScrollProvider } from 'components/scroll-provider/ScrollProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'

import { MainContentContextProvider } from '../pages/MainContentContext'

import { AppContextProvider } from './AppContextProvider'
import { AudiusQueryProvider } from './AudiusQueryProvider'
import { useHistoryContext } from './HistoryProvider'
import { ReduxProvider } from './ReduxProvider'
import { ThemeProvider } from './ThemeProvider'
import { TrpcProvider } from './TrpcProvider'

type AppContextProps = {
  children: ReactNode
}

export const AppProviders = ({ children }: AppContextProps) => {
  const { history } = useHistoryContext()
  return (
    <ReduxProvider>
      <ConnectedRouter history={history}>
        <LastLocationProvider>
          <TrpcProvider>
            <AudiusQueryProvider>
              <AppContextProvider>
                <ThemeProvider>
                  <NavProvider>
                    <ScrollProvider>
                      <RouterContextProvider>
                        <MainContentContextProvider>
                          <HeaderContextProvider>
                            <ToastContextProvider>
                              {children}
                            </ToastContextProvider>
                          </HeaderContextProvider>
                        </MainContentContextProvider>
                      </RouterContextProvider>
                    </ScrollProvider>
                  </NavProvider>
                </ThemeProvider>
              </AppContextProvider>
            </AudiusQueryProvider>
          </TrpcProvider>
        </LastLocationProvider>
      </ConnectedRouter>
    </ReduxProvider>
  )
}
