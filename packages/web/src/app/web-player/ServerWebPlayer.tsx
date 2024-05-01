import { PropsWithChildren, ReactNode, useRef } from 'react'

import '@audius/harmony/dist/harmony.css'
import cn from 'classnames'
import { ConnectedRouter } from 'connected-react-router'

import { AppErrorBoundary } from 'app/AppErrorBoundary'
import { HistoryContextProvider, useHistoryContext } from 'app/HistoryProvider'
import { ServerReduxProvider } from 'app/ServerReduxProvider'
import { ThemeProvider } from 'app/ThemeProvider'
import {
  HeaderContextProvider,
  HeaderContextConsumer
} from 'components/header/mobile/HeaderContextProvider'
import ServerNavigator from 'components/nav/ServerNavigator'
import { ServerPlayBar } from 'components/play-bar/desktop/ServerPlayBar'
import { useIsMobile } from 'hooks/useIsMobile'
import { MAIN_CONTENT_ID } from 'pages/MainContentContext'
import { SsrContextProvider, SsrContextType } from 'ssr/SsrContext'
import { getSystemAppearance, getTheme } from 'utils/theme/theme'

import styles from './WebPlayer.module.css'

type ServerWebPlayerProps = PropsWithChildren<{
  ssrContextValue: SsrContextType
}>

const InnerProviderContainer = ({ children }: { children: ReactNode }) => {
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
    <>
      <ServerReduxProvider initialStoreState={initialStoreState}>
        <ConnectedRouter history={history}>
          <ThemeProvider>
            <HeaderContextProvider>
              {/* @ts-ignore */}
              {children}
            </HeaderContextProvider>
          </ThemeProvider>
        </ConnectedRouter>
      </ServerReduxProvider>
    </>
  )
}

const ProviderContainer = ({
  ssrContextValue,
  children
}: ServerWebPlayerProps) => (
  <>
    <SsrContextProvider value={ssrContextValue}>
      <HistoryContextProvider>
        <InnerProviderContainer>
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </InnerProviderContainer>
      </HistoryContextProvider>
    </SsrContextProvider>
  </>
)

const WebPlayerContent = ({ children }: Partial<ServerWebPlayerProps>) => {
  const isMobile = useIsMobile()
  const mainContentRef = useRef(null)

  return (
    <div className={styles.root}>
      <div className={cn(styles.app, { [styles.mobileApp]: isMobile })}>
        <ServerNavigator />
        <div
          ref={mainContentRef}
          id={MAIN_CONTENT_ID}
          role='main'
          className={cn(styles.mainContentWrapper, {
            [styles.mainContentWrapperMobile]: isMobile
          })}
        >
          {/* @ts-ignore */}
          {isMobile && <HeaderContextConsumer />}
          {children}
        </div>

        <ServerPlayBar isMobile={isMobile} />
      </div>
    </div>
  )
}

export const ServerWebPlayer = ({
  ssrContextValue,
  ...other
}: ServerWebPlayerProps) => {
  return (
    <ProviderContainer ssrContextValue={ssrContextValue}>
      <WebPlayerContent {...other} />
    </ProviderContainer>
  )
}
