import { Helmet } from 'react-helmet'
import { Redirect, Route, RouteProps, Switch } from 'react-router-dom'

import { getSignOn } from 'common/store/pages/signon/selectors'
import { determineAllowedRoute } from 'pages/sign-up-page/utils/determineAllowedRoutes'
import { useSelector } from 'utils/reducer'
import {
  SIGN_UP_APP_CTA_PAGE,
  SIGN_UP_ARTISTS_PAGE,
  SIGN_UP_CREATE_LOGIN_DETAILS,
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_GENRES_PAGE,
  SIGN_UP_HANDLE_PAGE,
  SIGN_UP_PAGE,
  SIGN_UP_PASSWORD_PAGE,
  SIGN_UP_REVIEW_HANDLE_PAGE
} from 'utils/route'

import { CreateEmailPage } from './pages/CreateEmailPage'
import { CreateLoginDetailsPage } from './pages/CreateLoginDetails'
import { CreatePasswordPage } from './pages/CreatePasswordPage'
import { FinishProfilePage } from './pages/FinishProfilePage'
import { MobileAppCtaPage } from './pages/MobileAppCtaPage'
import { PickHandlePage } from './pages/PickHandlePage'
import { ReviewHandlePage } from './pages/ReviewHandlePage'
import { SelectArtistsPage } from './pages/SelectArtistsPage'
import { SelectGenresPage } from './pages/SelectGenresPage'
import { RouteContextProvider } from './utils/RouteContext'

const messages = {
  metaTitle: 'Sign Up • Audius',
  metaDescription: 'Create an account on Audius'
}

/**
 * <Route> wrapper that handles redirecting through the sign up page flow
 */
export function SignUpRoute({ children, ...rest }: RouteProps) {
  const signUpState = useSelector(getSignOn)

  return (
    <Route
      {...rest}
      render={({ location }) => {
        // Check if the route is allowed, if not we redirect accordingly
        const { isAllowedRoute, correctedRoute } = determineAllowedRoute(
          signUpState,
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
  return (
    <RouteContextProvider>
      <Helmet>
        <title>{messages.metaTitle}</title>
        <meta name='description' content={messages.metaDescription} />
      </Helmet>
      <Switch>
        <SignUpRoute exact path={SIGN_UP_PAGE} />
        <SignUpRoute exact path={SIGN_UP_EMAIL_PAGE}>
          <CreateEmailPage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_PASSWORD_PAGE}>
          <CreatePasswordPage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_CREATE_LOGIN_DETAILS}>
          <CreateLoginDetailsPage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_HANDLE_PAGE}>
          <PickHandlePage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_REVIEW_HANDLE_PAGE}>
          <ReviewHandlePage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_FINISH_PROFILE_PAGE}>
          <FinishProfilePage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_GENRES_PAGE}>
          <SelectGenresPage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_ARTISTS_PAGE}>
          <SelectArtistsPage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_APP_CTA_PAGE}>
          <MobileAppCtaPage />
        </SignUpRoute>
      </Switch>
    </RouteContextProvider>
  )
}
