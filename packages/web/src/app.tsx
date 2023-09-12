import '@audius/stems/dist/stems.css'

import { AudiusQueryContext } from '@audius/common'
import { ConnectedRouter } from 'connected-react-router'
import { Provider } from 'react-redux'
import { Route, Switch } from 'react-router-dom'
import { LastLocationProvider } from 'react-router-last-location'

import { CoinbasePayButtonProvider } from 'components/coinbase-pay-button'
import App from 'pages/App'
import { AppErrorBoundary } from 'pages/AppErrorBoundary'
import AppProviders from 'pages/AppProviders'
import { MainContentContext } from 'pages/MainContentContext'
import { OAuthLoginPage } from 'pages/oauth-login-page/OAuthLoginPage'
import { SomethingWrong } from 'pages/something-wrong/SomethingWrong'
import { apiClient } from 'services/audius-api-client'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { audiusSdk } from 'services/audius-sdk/audiusSdk'
import history from 'utils/history'

import { store } from './store/configureStore'
import { reportToSentry } from './store/errors/reportToSentry'

import './services/webVitals'
import './index.css'

const test: number = '12'

const AudiusApp = () => {
  return (
    <Provider store={store}>
      <AudiusQueryContext.Provider
        value={{
          apiClient,
          audiusBackend: audiusBackendInstance,
          audiusSdk,
          dispatch: store.dispatch,
          reportToSentry
        }}
      >
        <ConnectedRouter history={history}>
          <LastLocationProvider>
            <AppProviders>
              <MainContentContext.Consumer>
                {({ mainContentRef }) => (
                  <Switch>
                    <Route path='/error'>
                      <SomethingWrong />
                    </Route>
                    <Route
                      exact
                      path={'/oauth/auth'}
                      component={OAuthLoginPage}
                    />
                    <Route path='/'>
                      <AppErrorBoundary>
                        <CoinbasePayButtonProvider>
                          <App mainContentRef={mainContentRef} />
                        </CoinbasePayButtonProvider>
                      </AppErrorBoundary>
                    </Route>
                  </Switch>
                )}
              </MainContentContext.Consumer>
            </AppProviders>
          </LastLocationProvider>
        </ConnectedRouter>
      </AudiusQueryContext.Provider>
    </Provider>
  )
}

export default AudiusApp
