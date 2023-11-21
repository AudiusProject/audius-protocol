// @refresh reset

import { useEffect } from 'react'

import { Route, Switch } from 'react-router-dom'

import { CoinbasePayButtonProvider } from 'components/coinbase-pay-button'
import DemoTrpcPage from 'pages/demo-trpc/DemoTrpcPage'
import { OAuthLoginPage } from 'pages/oauth-login-page/OAuthLoginPage'
import { SomethingWrong } from 'pages/something-wrong/SomethingWrong'

import '../services/webVitals'

import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

import { AppErrorBoundary } from './AppErrorBoundary'
import { AppProviders } from './AppProviders'
import WebPlayer from './web-player/WebPlayer'

export const App = () => {
  useEffect(() => {
    remoteConfigInstance.init()
  }, [])

  return (
    <AppProviders>
      <SomethingWrong />
      <Switch>
        <Route exact path='/oauth/auth'>
          <OAuthLoginPage />
        </Route>
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
