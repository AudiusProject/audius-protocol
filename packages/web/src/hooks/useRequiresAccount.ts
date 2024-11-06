import { useEffect, MouseEvent as ReactMouseEvent, useCallback } from 'react'

import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom-v5-compat'

import {
  openSignOn,
  showRequiresAccountToast,
  updateRouteOnCompletion,
  updateRouteOnExit
} from 'common/store/pages/signon/actions'
import { useSelector } from 'utils/reducer'
const { getHasAccount, getAccountStatus } = accountSelectors

/**
 * Like useCallback but designed to be used to redirect unauthenticated users
 * to sign in/up in the case they are not logged in.
 */
export const useRequiresAccountCallback = <T extends (...args: any) => any>(
  callback: T,
  deps: any[],
  onOpenAuthModal?: () => void,
  returnRouteOverride?: string
) => {
  const hasAccount = useSelector(getHasAccount)
  const accountStatus = useSelector(getAccountStatus)
  const dispatch = useDispatch()
  const location = useLocation()
  const returnRoute = returnRouteOverride ?? location.pathname

  return useCallback(
    (...args: Parameters<T>) => {
      if (accountStatus !== Status.LOADING && !hasAccount) {
        dispatch(updateRouteOnExit(returnRoute))
        dispatch(updateRouteOnCompletion(returnRoute))
        dispatch(openSignOn(/** signIn */ false))
        dispatch(showRequiresAccountToast())
        onOpenAuthModal?.()
      } else {
        // eslint-disable-next-line n/no-callback-literal
        return callback(...args)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasAccount, dispatch, ...deps]
  )
}

/**
 * Like useAuthenticatedCallback but designed to be used for click handlers so that
 * clicks are not propagated.
 */
export const useRequiresAccountOnClick = <
  T extends (e: ReactMouseEvent<Element, MouseEvent>) => any
>(
  callback: T,
  deps: any[],
  onOpenAuthModal?: () => void,
  returnRouteOverride?: string
) => {
  return useRequiresAccountCallback(
    (e: ReactMouseEvent<Element, MouseEvent>) => {
      e.stopPropagation()
      return callback(e)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
    onOpenAuthModal,
    returnRouteOverride
  )
}

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
export const useRequiresAccountFn = (returnRouteOverride?: string) => {
  const requiresAccount = useRequiresAccountCallback(
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
  const { requiresAccount } = useRequiresAccountFn(returnRouteOverride)

  useEffect(() => {
    requiresAccount()
  }, [requiresAccount])
}
