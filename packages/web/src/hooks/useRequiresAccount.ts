import { useEffect } from 'react'

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
 * Checks that a user is signed in, else redirects to the sign in
 * page with a banner saying - you need an account to do that
 * @param route - Optional route to visit after sign up
 */
export const useRequiresAccount = (route?: string) => {
  const hasAccount = useSelector(getHasAccount)
  const accountStatus = useSelector(getAccountStatus)
  const dispatch = useDispatch()

  useEffect(() => {
    if (accountStatus !== Status.LOADING && !hasAccount) {
      if (route) dispatch(updateRouteOnExit(route))
      dispatch(pushRoute(SIGN_UP_PAGE))
      dispatch(showRequiresAccountModal())
    }
  }, [dispatch, accountStatus, hasAccount, route])
}
