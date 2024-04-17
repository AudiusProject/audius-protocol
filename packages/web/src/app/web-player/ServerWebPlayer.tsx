import { useRef } from 'react'

import cn from 'classnames'

import { AppErrorBoundary } from 'app/AppErrorBoundary'
import { AppProviders } from 'app/AppProviders'
import { HistoryContextProvider } from 'app/HistoryProvider'
import Navigator from 'components/nav/Navigator'
import TopLevelPage from 'components/nav/mobile/TopLevelPage'
// import PlayBarProvider from 'components/play-bar/PlayBarProvider'
import { MAIN_CONTENT_ID } from 'pages/MainContentContext'
import {
  SsrContextProvider,
  SsrContextType,
  useSsrContext
} from 'ssr/SsrContext'

import { HarmonyCacheProvider } from '../../HarmonyCacheProvider'

import styles from './WebPlayer.module.css'

type ServerWebPlayerProps = {
  ssrContextValue: SsrContextType
  // TODO: Add children prop
  children: any
}

const ProviderContainer = ({
  ssrContextValue,
  children
}: ServerWebPlayerProps) => (
  <HarmonyCacheProvider>
    <SsrContextProvider value={ssrContextValue}>
      <HistoryContextProvider>
        <AppProviders>
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </AppProviders>
      </HistoryContextProvider>
    </SsrContextProvider>
  </HarmonyCacheProvider>
)

export const ServerWebPlayer = ({
  ssrContextValue,
  children
}: ServerWebPlayerProps) => {
  const { isMobile } = useSsrContext()
  const mainContentRef = useRef(null)
  console.log('IN THE SERVER_WEB_PLAYER')

  return (
    <ProviderContainer ssrContextValue={ssrContextValue}>
      <div className={styles.root}>
        <div className={cn(styles.app, { [styles.mobileApp]: isMobile })}>
          <Navigator />
          <div
            ref={mainContentRef}
            id={MAIN_CONTENT_ID}
            role='main'
            className={cn(styles.mainContentWrapper, {
              [styles.mainContentWrapperMobile]: isMobile
            })}
          >
            {isMobile && <TopLevelPage />}
            {/* {isMobile && <HeaderContextConsumer />} */}
            {children}
          </div>

          {/* <PlayBarProvider isMobile={isMobile} /> */}
        </div>
      </div>
    </ProviderContainer>
  )
}
