import { waitForAccount } from '@audius/common/utils'
import { call } from 'typed-redux-saga'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import {
  waitForConfirmedReachability,
  waitForReachability
} from 'store/reachability/sagas'

/**
 * Required for all writes.
 * NOTE: This does not ensure that the account exists. If the account is required
 * for your operation, call `ensureLoggedIn` or an equivalent after calling `waitForWrite`.
 */
export function* waitForWrite() {
  yield* call(waitForBackendSetup)
  yield* call(waitForAccount)
  yield* call(waitForConfirmedReachability)
}

/**
 * Required for all reads
 */
export function* waitForRead() {
  yield* call(waitForReachability)
  yield* call(waitForAccount)
}
