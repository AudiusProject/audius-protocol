import { waitForAccount } from '@audius/common'
import { call } from 'typed-redux-saga'

import {
  waitForBackendSetup,
  waitForReachability
} from 'common/store/backend/sagas'

/**
 * Required for all writes
 */
export function* waitForWrite() {
  yield* call(waitForBackendSetup)
  yield* call(waitForAccount)
}

/**
 * Required for all reads
 */
export function* waitForRead() {
  yield* call(waitForReachability)
  yield* call(waitForAccount)
}
