import { useEffect } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { getAccountUser } from 'common/store/account/selectors'
import {
  showRequiresAccountModal,
  updateRouteOnExit
} from 'common/store/pages/signon/actions'
import { useSelector } from 'utils/reducer'
import { SIGN_UP_PAGE } from 'utils/route'

/**
 * Checks that a user is signed in, else redirects to the sign in
 * page with a banner saying - you need an account to do that
 */
export const useRequiresAccount = (route?: string) => {
  const account = useSelector(getAccountUser)
  const dispatch = useDispatch()
  useEffect(() => {
    if (!account) {
      if (route) dispatch(updateRouteOnExit(route))
      dispatch(pushRoute(SIGN_UP_PAGE))
      dispatch(showRequiresAccountModal())
    }
  }, [dispatch, account, route])
}
