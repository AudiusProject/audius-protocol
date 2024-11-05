import { useEffect } from 'react'

import { useAuthenticatedCallback } from './useAuthenticatedCallback'

/**
 * Creates a callback to verify user authentication.
 *
 * When invoked, this callback checks if the user is signed in.
 * If not, it redirects to the sign-in page and displays a banner
 * informing the user that an account is required for the action.
 *
 * @param returnRouteOverride - Optional route to navigate to after successful sign-up
 * @returns A function that, when called, performs the authentication check and redirection
 */
export const useRequiresAccountCallback = (returnRouteOverride?: string) => {
  const requiresAccount = useAuthenticatedCallback(
    () => {},
    [],
    undefined,
    returnRouteOverride
  )
  return { requiresAccount }
}

/**
 * Hook that checks if a user is signed in. If not, it redirects to the sign-up page
 * and displays a banner informing the user that an account is required.
 *
 * This hook automatically triggers the authentication check on mount and
 * whenever its dependencies change.
 *
 * @param returnRouteOverride - Optional route to navigate to after successful sign-up
 */
export const useRequiresAccount = (returnRouteOverride?: string) => {
  const { requiresAccount } = useRequiresAccountCallback(returnRouteOverride)

  useEffect(() => {
    requiresAccount()
  }, [requiresAccount])
}
