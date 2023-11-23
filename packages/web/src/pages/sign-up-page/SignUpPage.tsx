import { Paper } from '@audius/harmony'
import { Helmet } from 'react-helmet'
import { useSelector } from 'react-redux'
import { Redirect, Route, RouteProps, Switch } from 'react-router-dom'

import { getSignOn } from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { NavHeader } from 'pages/sign-up-page/components/NavHeader'
import { determineAllowedRoute } from 'pages/sign-up-page/utils'
import { AppState } from 'store/types'
import {
  SIGN_UP_ARTISTS_PAGE,
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_GENRES_PAGE,
  SIGN_UP_HANDLE_PAGE,
  SIGN_UP_PAGE,
  SIGN_UP_PASSWORD_PAGE
} from 'utils/route'

import { ProgressHeader } from './components/ProgressHeader'
import { CreateEmailPage } from './pages/CreateEmailPage'
import { CreatePasswordPage } from './pages/CreatePasswordPage'
import { FinishProfilePage } from './pages/FinishProfilePage'
import { PickHandlePage } from './pages/PickHandlePage'
import { SelectArtistsPage } from './pages/SelectArtistsPage'
import { SelectGenrePage } from './pages/SelectGenrePage'

const messages = {
  metaTitle: 'Sign Up',
  metaDescription: 'Create an account on Audius'
}

/**
 * <Route> wrapper that handles redirecting through the sign up page flow
 */
export function SignUpRoute({ children, ...rest }: RouteProps) {
  const existingSignUpState = useSelector((state: AppState) => getSignOn(state))
  return (
    <Route
      {...rest}
      render={({ location }) => {
        // Check if the route is allowed, if not we redirect accordingly
        const { isAllowedRoute, correctedRoute } = determineAllowedRoute(
          existingSignUpState,
          location.pathname
        )
        return isAllowedRoute ? (
          <>{children}</>
        ) : (
          <Redirect to={correctedRoute} />
        )
      }}
    />
  )
}

export const SignUpPage = () => {
  const { isDesktop } = useMedia()

  return (
    <>
      <Helmet>
        <title>{messages.metaTitle}</title>
        <meta name='description' content={messages.metaDescription} />
      </Helmet>
      <NavHeader />
      <Switch>
        <Route exact path={SIGN_UP_PAGE}>
          <Redirect to={SIGN_UP_EMAIL_PAGE} />
        </Route>
        <SignUpRoute exact path={SIGN_UP_EMAIL_PAGE}>
          <CreateEmailPage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_PASSWORD_PAGE}>
          <CreatePasswordPage />
        </SignUpRoute>
        <SignUpRoute
          exact
          path={[
            SIGN_UP_HANDLE_PAGE,
            SIGN_UP_FINISH_PROFILE_PAGE,
            SIGN_UP_GENRES_PAGE,
            SIGN_UP_ARTISTS_PAGE
          ]}
        >
          {isDesktop ? <ProgressHeader /> : null}
          <Switch>
            <SignUpRoute exact path={SIGN_UP_HANDLE_PAGE}>
              <PickHandlePage />
            </SignUpRoute>
          </Switch>
          <Switch>
            <SignUpRoute exact path={SIGN_UP_FINISH_PROFILE_PAGE}>
              <FinishProfilePage />
            </SignUpRoute>
          </Switch>
          <Switch>
            <SignUpRoute exact path={SIGN_UP_GENRES_PAGE}>
              <SelectGenrePage />
            </SignUpRoute>
          </Switch>
          <Switch>
            <SignUpRoute exact path={SIGN_UP_ARTISTS_PAGE}>
              <SelectArtistsPage />
            </SignUpRoute>
          </Switch>
        </SignUpRoute>
      </Switch>
    </>
  )
}
