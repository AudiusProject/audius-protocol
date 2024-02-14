import { accountSelectors, getContext } from '@audius/common/store'
import { waitForAccount } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { call, put, select } from 'typed-redux-saga'

import {
  updateRouteOnExit,
  showRequiresAccountModal
} from 'common/store/pages/signon/actions'

import { SIGN_UP_PAGE } from '../../utils/route'

const { getAccountUser } = accountSelectors

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
    const account = yield* select(getAccountUser)
    if (!account) {
      if (!isNativeMobile) {
        if (route) {
          yield* put(updateRouteOnExit(route))
        }
        yield* put(pushRoute(SIGN_UP_PAGE))
        yield* put(showRequiresAccountModal())
      }
    } else {
      return yield* call(fn, ...args)
    }
  }
}
