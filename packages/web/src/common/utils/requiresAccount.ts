import { accountSelectors, getContext } from '@audius/common/store'
import { route, waitForAccount } from '@audius/common/utils'
import { call, put, select } from 'typed-redux-saga'

import {
  updateRouteOnExit,
  showRequiresAccountToast
} from 'common/store/pages/signon/actions'
import { push as pushRoute } from 'utils/navigation'

const { SIGN_UP_PAGE } = route

const { getHasAccount, getIsGuestAccount } = accountSelectors

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
    const isGuest = yield* select(getIsGuestAccount)
    if (!hasAccount || isGuest) {
      if (!isNativeMobile) {
        if (route) {
          yield* put(updateRouteOnExit(route))
        }
        console.log('asdf requires account')
        yield* put(pushRoute(SIGN_UP_PAGE))
        yield* put(showRequiresAccountToast())
      }
    } else {
      return yield* call(fn, ...args)
    }
  }
}
