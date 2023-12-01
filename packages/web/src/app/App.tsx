// @refresh reset

import { lazy } from 'react'

import { FeatureFlags, useFeatureFlag } from '@audius/common'
import { Route, Switch } from 'react-router-dom'

import { CoinbasePayButtonProvider } from 'components/coinbase-pay-button'
import DemoTrpcPage from 'pages/demo-trpc/DemoTrpcPage'
import { OAuthLoginPage } from 'pages/oauth-login-page/OAuthLoginPage'
import { SomethingWrong } from 'pages/something-wrong/SomethingWrong'
import { SIGN_IN_PAGE, SIGN_UP_PAGE } from 'utils/route'

import { AppErrorBoundary } from './AppErrorBoundary'
import { AppProviders } from './AppProviders'
import WebPlayer from './web-player/WebPlayer'

import '../services/webVitals'

const SignOn = lazy(() => import('pages/sign-on/SignOn'))
const SignOnPage = lazy(() => import('pages/sign-on-page'))

export const AppInner = () => {
  const { isEnabled: isSignInRedesignEnabled, isLoaded } = useFeatureFlag(
    FeatureFlags.SIGN_UP_REDESIGN
  )

  return (
    <>
      <SomethingWrong />
      <Switch>
        <Route path={[SIGN_IN_PAGE, SIGN_UP_PAGE]}>
          {isLoaded ? (
            isSignInRedesignEnabled ? (
              <SignOnPage />
            ) : (
              <SignOn signIn />
            )
          ) : null}
        </Route>
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
    </>
  )
}

export const App = () => {
  return (
    <AppProviders>
      <AppInner />
    </AppProviders>
  )
}
