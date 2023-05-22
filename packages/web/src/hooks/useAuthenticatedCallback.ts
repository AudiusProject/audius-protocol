import { useCallback } from 'react'

import { accountSelectors } from '@audius/common'
import { useDispatch } from 'react-redux'

import {
  openSignOn,
  showRequiresAccountModal
} from 'common/store/pages/signon/actions'
import { useSelector } from 'utils/reducer'
const { getHasAccount } = accountSelectors

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
