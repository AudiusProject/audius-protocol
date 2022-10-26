import { waitForAccount } from '@audius/common'
import { call } from 'typed-redux-saga'

import { waitForBackendSetup } from 'common/store/backend/sagas'

export function* waitForBackendAndAccount() {
  yield* call(waitForBackendSetup)
  yield* call(waitForAccount)
}
