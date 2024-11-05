import { MouseEvent as ReactMouseEvent, useCallback } from 'react'

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
export const useAuthenticatedCallback = <T extends (...args: any) => any>(
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
export const useAuthenticatedClickCallback = <
  T extends (e: ReactMouseEvent<Element, MouseEvent>) => any
>(
  callback: T,
  deps: any[],
  onOpenAuthModal?: () => void,
  returnRouteOverride?: string
) => {
  return useAuthenticatedCallback(
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
