import { waitForAccount } from '@audius/common'
import { call } from 'typed-redux-saga'

import { waitForBackendSetup } from 'common/store/backend/sagas'
import {
  waitForConfirmedReachability,
  waitForReachability
} from 'store/reachability/sagas'

/**
 * Required for all writes
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
