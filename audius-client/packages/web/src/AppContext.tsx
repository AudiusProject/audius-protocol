import React from 'react'

import { HeaderContextProvider } from 'components/general/header/mobile/HeaderContextProvider'
import { ToastContextProvider } from 'components/toast/ToastContext'
import { MainContentContextProvider } from 'containers/MainContentContext'
import { RouterContextProvider } from 'containers/animated-switch/RouterContextProvider'
import { NavProvider } from 'containers/nav/store/context'
import { ScrollProvider } from 'containers/scroll-provider/ScrollProvider'

type AppContextProps = {
  children: JSX.Element
}

const AppContext = ({ children }: AppContextProps) => {
  return (
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
  )
}

export default AppContext
