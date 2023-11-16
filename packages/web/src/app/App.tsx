// @refresh reset

import { Route, Switch } from 'react-router-dom'

import { CoinbasePayButtonProvider } from 'components/coinbase-pay-button'
import DemoTrpcPage from 'pages/demo-trpc/DemoTrpcPage'
import { OAuthLoginPage } from 'pages/oauth-login-page/OAuthLoginPage'
import { SomethingWrong } from 'pages/something-wrong/SomethingWrong'

import '../services/webVitals'

import { AppErrorBoundary } from './AppErrorBoundary'
import AppProviders from './AppProviders'
import WebPlayer from './web-player/WebPlayer'

export const App = () => {
  return (
    <AppProviders>
      <SomethingWrong />
      <Switch>
        <Route exact path={'/oauth/auth'} component={OAuthLoginPage} />
        <Route path='/demo/trpc'>
          <DemoTrpcPage />
        </Route>
        <Route path='/'>
          <AppErrorBoundary>
            <CoinbasePayButtonProvider>
              <WebPlayer />
            </CoinbasePayButtonProvider>
          </AppErrorBoundary>
        </Route>
      </Switch>
    </AppProviders>
  )
}
