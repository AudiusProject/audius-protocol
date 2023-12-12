// @refresh reset

import { Suspense, lazy } from 'react'

import { FeatureFlags, useFeatureFlag } from '@audius/common'
import { Route, Switch } from 'react-router-dom'

import { CoinbasePayButtonProvider } from 'components/coinbase-pay-button'
import { SomethingWrong } from 'pages/something-wrong/SomethingWrong'
import { SIGN_IN_PAGE, SIGN_ON_ALIASES, SIGN_UP_PAGE } from 'utils/route'

import { AppErrorBoundary } from './AppErrorBoundary'
import { AppProviders } from './AppProviders'
import WebPlayer from './web-player/WebPlayer'

import '../services/webVitals'

const SignOnPage = lazy(() => import('pages/sign-on-page'))
const SignOn = lazy(() => import('pages/sign-on/SignOn'))
const OAuthLoginPage = lazy(() => import('pages/oauth-login-page'))
const DemoTrpcPage = lazy(() => import('pages/demo-trpc/DemoTrpcPage'))

export const AppInner = () => {
  const { isEnabled: isSignInRedesignEnabled, isLoaded } = useFeatureFlag(
    FeatureFlags.SIGN_UP_REDESIGN
  )

  return (
    <>
      <SomethingWrong />
      <Suspense fallback={null}>
        <Switch>
          <Route path={[SIGN_IN_PAGE, SIGN_UP_PAGE, ...SIGN_ON_ALIASES]}>
            {({ location }) => {
              if (!isLoaded) return null
              if (isSignInRedesignEnabled) return <SignOnPage />
              return <SignOn signIn={location.pathname === SIGN_IN_PAGE} />
            }}
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
      </Suspense>
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
