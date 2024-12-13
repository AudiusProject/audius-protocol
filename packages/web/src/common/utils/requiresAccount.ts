import { accountSelectors, getContext } from '@audius/common/store'
import { route, waitForAccount } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { call, put, select } from 'typed-redux-saga'

import {
  updateRouteOnExit,
  showRequiresAccountToast
} from 'common/store/pages/signon/actions'

const { SIGN_UP_PAGE } = route

const { getHasAccount } = accountSelectors

/**
 * Checks if the user is signed in with an account.
 * If they are signed in, `fn` is invoked, otherwise, the
 * user is directed to the sign-up page.
 */
export function requiresAccount<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  // optional route to go to on closing the sign up page/modal
  route?: string
) {
  return function* (...args: TArgs) {
    const isNativeMobile = yield* getContext('isNativeMobile')
    yield* waitForAccount()
    const hasAccount = yield* select(getHasAccount)
    const localStorage = yield* getContext('localStorage')
    const isGuest = yield* call([localStorage, 'getGuestEmail'])
    if (!hasAccount || isGuest) {
      if (!isNativeMobile) {
        if (route) {
          yield* put(updateRouteOnExit(route))
        }
        yield* put(pushRoute(SIGN_UP_PAGE))
        yield* put(showRequiresAccountToast())
      }
    } else {
      return yield* call(fn, ...args)
    }
  }
}
