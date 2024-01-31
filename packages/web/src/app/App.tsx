// @refresh reset

import { useEffect, Suspense, lazy } from 'react'

import { FeatureFlags } from '@audius/common'
import { useFeatureFlag } from '@audius/common/hooks'
import { CoinflowPurchaseProtection } from '@coinflowlabs/react'
import { Redirect, Route, Switch } from 'react-router-dom'

import { CoinbasePayButtonProvider } from 'components/coinbase-pay-button'
import { SomethingWrong } from 'pages/something-wrong/SomethingWrong'
import { env } from 'services/env'
import { initWebVitals } from 'services/webVitals'
import { SIGN_IN_PAGE, SIGN_ON_ALIASES, SIGN_UP_PAGE } from 'utils/route'

import { AppErrorBoundary } from './AppErrorBoundary'
import { AppProviders } from './AppProviders'
import { useHistoryContext } from './HistoryProvider'
import WebPlayer from './web-player/WebPlayer'

const SignOnPage = lazy(() => import('pages/sign-on-page'))
const SignOn = lazy(() => import('pages/sign-on/SignOn'))
const OAuthLoginPage = lazy(() => import('pages/oauth-login-page'))
const DemoTrpcPage = lazy(() => import('pages/demo-trpc/DemoTrpcPage'))
const TrpcHistoryPage = lazy(() => import('pages/demo-trpc/TrpcHistory'))

const MERCHANT_ID = env.COINFLOW_MERCHANT_ID
const IS_PRODUCTION = env.ENVIRONMENT === 'production'

export const AppInner = () => {
  const { history } = useHistoryContext()

  useEffect(() => {
    initWebVitals(history.location)
  }, [history])

  const { isEnabled: isSignInRedesignEnabled, isLoaded } = useFeatureFlag(
    FeatureFlags.SIGN_UP_REDESIGN
  )

  return (
    <>
      <SomethingWrong />
      <Suspense fallback={null}>
        <CoinflowPurchaseProtection
          merchantId={MERCHANT_ID || ''}
          coinflowEnv={IS_PRODUCTION ? 'prod' : 'sandbox'}
        />
        <Switch>
          {SIGN_ON_ALIASES.map((a) => (
            <Redirect key={a} from={a} to={SIGN_IN_PAGE} />
          ))}
          <Route path={[SIGN_IN_PAGE, SIGN_UP_PAGE]}>
            {({ location }) => {
              if (!isLoaded) return null
              if (isSignInRedesignEnabled) return <SignOnPage />
              return <SignOn signIn={location.pathname === SIGN_IN_PAGE} />
            }}
          </Route>
          <Route exact path='/oauth/auth'>
            <OAuthLoginPage />
          </Route>
          <Route path='/demo/trpc/history'>
            <TrpcHistoryPage />
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
