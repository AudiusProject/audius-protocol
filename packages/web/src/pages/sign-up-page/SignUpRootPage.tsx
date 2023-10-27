import { useSelector } from 'react-redux'
import { Redirect, Route, RouteProps, Switch } from 'react-router-dom'

import { getSignOn } from 'common/store/pages/signon/selectors'
import SignOnPageState from 'common/store/pages/signon/types'
import { AppState } from 'store/types'
import {
  SIGN_UP_ARTISTS_PAGE,
  SIGN_UP_EMAIL_PAGE,
  SIGN_UP_FINISH_PROFILE_PAGE,
  SIGN_UP_GENRES_PAGE,
  SIGN_UP_HANDLE_PAGE,
  SIGN_UP_PASSWORD_PAGE,
  SignUpPath,
  TRENDING_PAGE
} from 'utils/route'

import { CreatePasswordPage } from './pages/CreatePasswordPage'
import { FinishProfilePage } from './pages/FinishProfilePage'
import { PickHandlePage } from './pages/PickHandlePage'
import { SelectArtistsPage } from './pages/SelectArtistsPage'
import { SelectGenrePage } from './pages/SelectGenrePage'
import { SignUpPage } from './pages/SignUpPage'

// TODO: type this correctly
const determineAllowedRoute = (
  signUpData: SignOnPageState,
  routeAttempt: string | SignUpPath
) => {
  // Have to type as string[] to avoid too narrow of a type for comparing against
  let allowedRoutes: string[] = [SignUpPath.createEmail] // create email is available by default
  if (signUpData.email.value) {
    // Already have email
    allowedRoutes.push(SignUpPath.createPassword)
  }
  if (signUpData.password.value) {
    // Already have password
    allowedRoutes.push(SignUpPath.pickHandle)
  }
  if (signUpData.handle.value) {
    // Already have handle
    allowedRoutes.push(SignUpPath.finishProfile)
  }
  if (signUpData.name.value) {
    // Already have display name
    // At this point the account is fully created & logged in; now user can't back to account creation steps
    allowedRoutes = [SignUpPath.selectGenres]
  }
  // TODO: These checks below here may need to fall under a different route umbrella separate from sign up
  if (signUpData.genres) {
    // Already have genres selected
    allowedRoutes.push(SignUpPath.selectArtists)
  }

  if (signUpData.followArtists?.selectedUserIds?.length >= 3) {
    // Already have 3 artists followed (already done with sign up if at this point)
    // TODO: trigger welcome modal when redirecting from here
    return { isAllowedRoute: false, correctedRoute: TRENDING_PAGE }
  }

  const isAllowedRoute = allowedRoutes.includes(routeAttempt)
  // If requested route is allowed return that, otherwise return the last step in the route stack
  const correctedPath = isAllowedRoute
    ? routeAttempt
    : allowedRoutes[allowedRoutes.length - 1]
  return {
    isAllowedRoute,
    correctedRoute: `/signup/${correctedPath}`
  }
}

/**
 * Protected route wrapper that handles redirecting through the sign up page flow
 */
export function SignUpRoute({ children, ...rest }: RouteProps) {
  const existingSignUpState = useSelector((state: AppState) => getSignOn(state))
  return (
    <Route
      {...rest}
      render={({ location }) => {
        // Get the requested sub-route
        const requestedPath = location.pathname.replace('/signup/', '')
        const { isAllowedRoute, correctedRoute } = determineAllowedRoute(
          existingSignUpState,
          requestedPath
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

export const SignUpRootPage = () => {
  return (
    <div>
      <Switch>
        <Route exact path={SIGN_UP_EMAIL_PAGE}>
          <SignUpPage />
        </Route>
        <Route exact path={SIGN_UP_PASSWORD_PAGE}>
          <CreatePasswordPage />
        </Route>
        <Route exact path={SIGN_UP_HANDLE_PAGE}>
          <PickHandlePage />
        </Route>
        <Route exact path={SIGN_UP_FINISH_PROFILE_PAGE}>
          <FinishProfilePage />
        </Route>
        <Route exact path={SIGN_UP_GENRES_PAGE}>
          <SelectGenrePage />
        </Route>
        <Route exact path={SIGN_UP_ARTISTS_PAGE}>
          <SelectArtistsPage />
        </Route>
      </Switch>
    </div>
  )
}
