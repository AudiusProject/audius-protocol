import { useCallback, useEffect } from 'react'

import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import {
  showRequiresAccountModal,
  updateRouteOnExit
} from 'common/store/pages/signon/actions'
import { useSelector } from 'utils/reducer'
const { SIGN_UP_PAGE } = route
const { getHasAccount, getAccountStatus } = accountSelectors

/**
 * Creates a callback to verify user authentication.
 *
 * When invoked, this callback checks if the user is signed in.
 * If not, it redirects to the sign-in page and displays a banner
 * informing the user that an account is required for the action.
 *
 * @param route - Optional route to navigate to after successful sign-up
 * @returns A function that, when called, performs the authentication check and redirection
 */
export const useRequiresAccountCallback = (route?: string) => {
  const hasAccount = useSelector(getHasAccount)
  const accountStatus = useSelector(getAccountStatus)
  const dispatch = useDispatch()

  const requiresAccount = useCallback(() => {
    if (accountStatus !== Status.LOADING && !hasAccount) {
      if (route) dispatch(updateRouteOnExit(route))
      dispatch(pushRoute(SIGN_UP_PAGE))
      dispatch(showRequiresAccountModal())
    }
  }, [accountStatus, hasAccount, route, dispatch])

  return { requiresAccount }
}

/**
 * Hook that checks if a user is signed in. If not, it redirects to the sign-up page
 * and displays a banner informing the user that an account is required.
 *
 * This hook automatically triggers the authentication check on mount and
 * whenever its dependencies change.
 *
 * @param route - Optional route to navigate to after successful sign-up
 */
export const useRequiresAccount = (route?: string) => {
  const { requiresAccount } = useRequiresAccountCallback(route)

  useEffect(() => {
    requiresAccount()
  }, [requiresAccount])
}
