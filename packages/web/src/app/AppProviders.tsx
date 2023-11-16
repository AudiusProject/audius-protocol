import { ReactNode } from 'react'

import { ConnectedRouter } from 'connected-react-router'
import { Provider } from 'react-redux'
import { LastLocationProvider } from 'react-router-last-location'
import { PersistGate } from 'redux-persist/integration/react'

import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/HeaderContextProvider'
import { NavProvider } from 'components/nav/store/context'
import { ScrollProvider } from 'components/scroll-provider/ScrollProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { persistor, store } from 'store/configureStore'
import history from 'utils/history'

import { MainContentContextProvider } from '../pages/MainContentContext'

import { AppContextProvider } from './AppContextProvider'
import { AudiusQueryProvider } from './AudiusQueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { TrpcProvider } from './TrpcProvider'

type AppContextProps = {
  children: ReactNode
}

export const AppProviders = ({ children }: AppContextProps) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
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
      </PersistGate>
    </Provider>
  )
}
