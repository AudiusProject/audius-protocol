// @refresh reset
import { useMemo, useState } from 'react'

import {
  AudiusQueryContext,
  accountSelectors,
  createAudiusTrpcClient,
  trpc
} from '@audius/common'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectedRouter } from 'connected-react-router'
import { Provider, useSelector } from 'react-redux'
import { Route, Switch } from 'react-router-dom'
import { LastLocationProvider } from 'react-router-last-location'
import { PersistGate } from 'redux-persist/integration/react'

import { CoinbasePayButtonProvider } from 'components/coinbase-pay-button'
import App from 'pages/App'
import { AppErrorBoundary } from 'pages/AppErrorBoundary'
import AppProviders from 'pages/AppProviders'
import { MainContentContext } from 'pages/MainContentContext'
import DemoTrpcPage from 'pages/demo-trpc/DemoTrpcPage'
import { OAuthLoginPage } from 'pages/oauth-login-page/OAuthLoginPage'
import { SomethingWrong } from 'pages/something-wrong/SomethingWrong'
import { audiusQueryContext } from 'services/audiusQueryContext'
import history from 'utils/history'

import { persistor, store } from './store/configureStore'

import './index.css'
import './services/webVitals'

const AudiusTrpcProvider = ({ children }: { children: React.ReactNode }) => {
  const currentUserId = useSelector(accountSelectors.getUserId)
  const [queryClient] = useState(() => new QueryClient())
  const trpcClient = useMemo(
    () => createAudiusTrpcClient(currentUserId),
    [currentUserId]
  )
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

const AudiusApp = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AudiusTrpcProvider>
          <AudiusQueryContext.Provider value={audiusQueryContext}>
            <ConnectedRouter history={history}>
              <LastLocationProvider>
                <AppProviders>
                  <MainContentContext.Consumer>
                    {({ mainContentRef }) => (
                      <>
                        <SomethingWrong />
                        <Switch>
                          <Route
                            exact
                            path={'/oauth/auth'}
                            component={OAuthLoginPage}
                          />
                          <Route path='/demo/trpc'>
                            <DemoTrpcPage />
                          </Route>
                          <Route path='/'>
                            <AppErrorBoundary>
                              <CoinbasePayButtonProvider>
                                <App mainContentRef={mainContentRef} />
                              </CoinbasePayButtonProvider>
                            </AppErrorBoundary>
                          </Route>
                        </Switch>
                      </>
                    )}
                  </MainContentContext.Consumer>
                </AppProviders>
              </LastLocationProvider>
            </ConnectedRouter>
          </AudiusQueryContext.Provider>
        </AudiusTrpcProvider>
      </PersistGate>
    </Provider>
  )
}

export default AudiusApp
