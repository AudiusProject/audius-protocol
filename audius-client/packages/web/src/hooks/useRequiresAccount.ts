import {
  showRequiresAccountModal,
  updateRouteOnExit
} from 'containers/sign-on/store/actions'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getAccountUser } from 'store/account/selectors'
import { useSelector } from 'utils/reducer'
import { push as pushRoute } from 'connected-react-router'
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
