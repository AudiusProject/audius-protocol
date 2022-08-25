import { accountSelectors, waitForAccount } from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { call, put, select } from 'typed-redux-saga'

import {
  updateRouteOnExit,
  showRequiresAccountModal
} from 'common/store/pages/signon/actions'

import { SIGN_UP_PAGE } from './route'
const { getAccountUser } = accountSelectors

/**
 * Checks if the user is signed in with an account.
 * If they are signed in, `fn` is invoked, otherwise, the
 * user is directed to the sign-up page.
 * @param {function *} fn
 * @param {string=} route optional route to go to on closing the sign up page/modal
 */
export function requiresAccount<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  route?: string
) {
  return function* (...args: TArgs) {
    yield* waitForAccount()
    const account = yield* select(getAccountUser)
    if (!account) {
      if (route) {
        yield* put(updateRouteOnExit(route))
      }
      yield* put(pushRoute(SIGN_UP_PAGE))
      yield* put(showRequiresAccountModal())
    } else {
      return yield* call(fn, ...args)
    }
  }
}
