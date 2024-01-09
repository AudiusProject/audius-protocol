import SignOnPageState from 'common/store/pages/signon/types'
import { SignUpPath } from 'utils/route'

/**
 * Checks against existing sign up redux state,
 * then determines if the requested path should be allowed or not
 * if not allowed, also returns furthest step possible based on existing state
 */
export const determineAllowedRoute = (
  signUpState: SignOnPageState,
  requestedRoute: string | SignUpPath // this string should have already trimmed out /signup/
): {
  allowedRoutes: string[]
  isAllowedRoute: boolean
  correctedRoute: string
} => {
  const attemptedPath = requestedRoute.replace('/signup/', '')
  // Have to type as string[] to avoid too narrow of a type for comparing against
  let allowedRoutes: string[] = [SignUpPath.createEmail] // create email is available by default
  if (signUpState.linkedSocialOnFirstPage) {
    allowedRoutes.push(SignUpPath.createLoginDetails)
    allowedRoutes.push(SignUpPath.reviewHandle)
  }
  if (signUpState.email.value) {
    // Already have email
    allowedRoutes.push(SignUpPath.createPassword)

    if (signUpState.password.value || signUpState.useMetaMask) {
      // Already have password
      if (!signUpState.linkedSocialOnFirstPage) {
        allowedRoutes.push(SignUpPath.pickHandle)
      }

      if (signUpState.handle.value) {
        // Already have handle or it needs review
        allowedRoutes.push(SignUpPath.reviewHandle)
        allowedRoutes.push(SignUpPath.finishProfile)

        if (signUpState.finishedPhase1) {
          // Already have display name

          // At this point the account is fully created & logged in; now user can't back to account creation steps
          // TODO: What to do if account creation fails?
          allowedRoutes = [SignUpPath.selectGenres]

          // TODO: These checks below here may need to fall under a different route umbrella separate from sign up
          if (signUpState.genres) {
            // Already have genres selected
            allowedRoutes.push(SignUpPath.selectArtists)

            if (signUpState.followArtists?.selectedUserIds?.length >= 3) {
              // Already have 3 artists followed, ready to finish sign up
              allowedRoutes.push(SignUpPath.appCta)
              allowedRoutes.push(SignUpPath.loading)
            }
          }
        }
      }
    }
  }

  const isAllowedRoute = allowedRoutes.includes(attemptedPath)
  // If requested route is allowed return that, otherwise return the last step in the route stack
  const correctedPath = isAllowedRoute
    ? attemptedPath
    : allowedRoutes[allowedRoutes.length - 1]

  return {
    allowedRoutes,
    isAllowedRoute,
    correctedRoute: `/signup/${correctedPath}`
  }
}
