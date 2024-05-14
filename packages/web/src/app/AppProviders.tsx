import { ReactNode } from 'react'

import { ConnectedRouter } from 'connected-react-router'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { LastLocationProvider } from 'react-router-last-location'

import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/HeaderContextProvider'
import { NavProvider } from 'components/nav/store/context'
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
import { TrpcProvider } from './TrpcProvider'

type AppContextProps = {
  children: ReactNode
}

export const AppProviders = ({ children }: AppContextProps) => {
  const { history } = useHistoryContext()

  const initialStoreState = {
    ui: {
      theme: {
        theme: getTheme(),
        systemPreference: getSystemAppearance()
      }
    }
  }

  return (
    <ReduxProvider initialStoreState={initialStoreState}>
      <ConnectedRouter history={history}>
        <CompatRouter>
          <LastLocationProvider>
            <TrpcProvider>
              <AudiusQueryProvider>
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
              </AudiusQueryProvider>
            </TrpcProvider>
          </LastLocationProvider>
        </CompatRouter>
      </ConnectedRouter>
    </ReduxProvider>
  )
}
