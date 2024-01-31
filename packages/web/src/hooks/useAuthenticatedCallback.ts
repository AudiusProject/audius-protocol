import { MouseEvent as ReactMouseEvent, useCallback } from 'react'

import { accountSelectors } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import {
  openSignOn,
  showRequiresAccountModal
} from 'common/store/pages/signon/actions'
import { useSelector } from 'utils/reducer'
const { getHasAccount } = accountSelectors

/**
 * Like useCallback but designed to be used to redirect unauthenticated users
 * to sign in/up in the case they are not logged in.
 * @param callback
 * @param deps
 */
export const useAuthenticatedCallback = <T extends (...args: any) => any>(
  callback: T,
  deps: any[]
) => {
  const isSignedIn = useSelector(getHasAccount)
  const dispatch = useDispatch()

  return useCallback(
    (...args: Parameters<T>) => {
      if (!isSignedIn) {
        dispatch(openSignOn(/** signIn */ false))
        dispatch(showRequiresAccountModal())
      } else {
        // eslint-disable-next-line n/no-callback-literal
        return callback(...args)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSignedIn, dispatch, ...deps]
  )
}

/**
 * Like useAuthenticatedCallback but designed to be used for click handlers so that
 * clicks are not propagated.
 * @param callback
 * @param deps
 */
export const useAuthenticatedClickCallback = <
  T extends (e: ReactMouseEvent<Element, MouseEvent>) => any
>(
  callback: T,
  deps: any[]
) => {
  const isSignedIn = useSelector(getHasAccount)
  const dispatch = useDispatch()

  return useCallback(
    (e: ReactMouseEvent<Element, MouseEvent>) => {
      e.stopPropagation()

      if (!isSignedIn) {
        dispatch(openSignOn(/** signIn */ false))
        dispatch(showRequiresAccountModal())
      } else {
        // eslint-disable-next-line n/no-callback-literal
        return callback(e)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSignedIn, dispatch, ...deps]
  )
}
