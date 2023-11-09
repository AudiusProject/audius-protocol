import { RouterContextProvider } from 'components/animated-switch/RouterContextProvider'
import { HeaderContextProvider } from 'components/header/mobile/HeaderContextProvider'
import { NavProvider } from 'components/nav/store/context'
import { ScrollProvider } from 'components/scroll-provider/ScrollProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { MainContentContextProvider } from 'pages/MainContentContext'

import { AppContextProvider } from './AppContextProvider'
import { ThemeProvider } from './ThemeProvider'

type AppContextProps = {
  children: JSX.Element
}

const AppProviders = ({ children }: AppContextProps) => {
  return (
    <AppContextProvider>
      <ThemeProvider>
        <NavProvider>
          <ScrollProvider>
            <RouterContextProvider>
              <MainContentContextProvider>
                <HeaderContextProvider>
                  <ToastContextProvider>{children}</ToastContextProvider>
                </HeaderContextProvider>
              </MainContentContextProvider>
            </RouterContextProvider>
          </ScrollProvider>
        </NavProvider>
      </ThemeProvider>
    </AppContextProvider>
  )
}

export default AppProviders
