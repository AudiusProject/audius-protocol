import { PropsWithChildren } from 'react'

import { Box, PaperProps, Paper, BoxProps } from '@audius/harmony'
import { useSelector } from 'react-redux'
import { Redirect, Route, RouteProps, Switch } from 'react-router-dom'

import { getSignOn } from 'common/store/pages/signon/selectors'
import SignOnPageState from 'common/store/pages/signon/types'
import { useMedia } from 'hooks/useMedia'
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

import { ProgressHeader } from './components/ProgressHeader'
import { CreateEmailPage } from './pages/CreateEmailPage/CreateEmailPage'
import { CreatePasswordPage } from './pages/CreatePasswordPage'
import { FinishProfilePage } from './pages/FinishProfilePage'
import { PickHandlePage } from './pages/PickHandlePage'
import { SelectArtistsPage } from './pages/SelectArtistsPage'
import { SelectGenrePage } from './pages/SelectGenrePage'

/**
 * Checks against existing sign up redux state,
 * then determines if the requested path should be allowed or not
 * if not allowed, also returns furthest step possible based on existing state
 */
const determineAllowedRoute = (
  signUpState: SignOnPageState,
  requestedRoute: string | SignUpPath // this string should have already trimmed out /signup/
) => {
  const attemptedPath = requestedRoute.replace('/signup/', '')
  // Have to type as string[] to avoid too narrow of a type for comparing against
  let allowedRoutes: string[] = [SignUpPath.createEmail] // create email is available by default
  if (signUpState.email.value) {
    // Already have email
    allowedRoutes.push(SignUpPath.createPassword)
  }
  if (signUpState.password.value) {
    // Already have password
    allowedRoutes.push(SignUpPath.pickHandle)
  }
  if (signUpState.handle.value) {
    // Already have handle
    allowedRoutes.push(SignUpPath.finishProfile)
  }
  if (signUpState.name.value) {
    // Already have display name
    // At this point the account is fully created & logged in; now user can't back to account creation steps
    allowedRoutes = [SignUpPath.selectGenres]
  }

  // TODO: These checks below here may need to fall under a different route umbrella separate from sign up
  if (signUpState.genres) {
    // Already have genres selected
    allowedRoutes.push(SignUpPath.selectArtists)
  }

  if (signUpState.followArtists?.selectedUserIds?.length >= 3) {
    // Already have 3 artists followed
    // Done with sign up if at this point so we return early (none of these routes are allowed anymore)
    return { isAllowedRoute: false, correctedRoute: TRENDING_PAGE }
  }

  const isAllowedRoute = allowedRoutes.includes(attemptedPath)
  // If requested route is allowed return that, otherwise return the last step in the route stack
  const correctedPath = isAllowedRoute
    ? attemptedPath
    : allowedRoutes[allowedRoutes.length - 1]
  return {
    isAllowedRoute,
    correctedRoute: `/signup/${correctedPath}`
  }
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

const DesktopRootContainer = ({ children }: PropsWithChildren<PaperProps>) => (
  <Paper w={1280} h={864} direction='column' m='4xl'>
    {children}
  </Paper>
)

const MobileRootContainer = ({ children }: PropsWithChildren<BoxProps>) => (
  <Box h='100%'> {children}</Box>
)

export const SignUpRootPage = () => {
  const { isDesktop } = useMedia()
  const RootContainer = isDesktop ? DesktopRootContainer : MobileRootContainer
  return (
    <RootContainer>
      <Switch>
        <SignUpRoute exact path={SIGN_UP_EMAIL_PAGE}>
          <CreateEmailPage />
        </SignUpRoute>
        <SignUpRoute exact path={SIGN_UP_PASSWORD_PAGE}>
          <CreatePasswordPage />
        </SignUpRoute>
        {/* White screen routes */}
        <SignUpRoute
          exact
          path={[
            SIGN_UP_HANDLE_PAGE,
            SIGN_UP_FINISH_PROFILE_PAGE,
            SIGN_UP_GENRES_PAGE,
            SIGN_UP_ARTISTS_PAGE
          ]}
        >
          <ProgressHeader />
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
    </RootContainer>
  )
}
