import {
  accountActions,
  reachabilityActions,
  reachabilitySelectors,
  getContext
} from '@audius/common'
import {
  put,
  all,
  delay,
  take,
  takeEvery,
  select,
  call,
  race
} from 'typed-redux-saga'

import * as backendActions from './actions'
import { watchBackendErrors } from './errorSagas'
const { getIsReachable } = reachabilitySelectors

const REACHABILITY_TIMEOUT_MS = 8 * 1000

/**
 * Waits for the backend to be setup. Can be used as a blocking call in another saga,
 * For example:
 * function * saga () {
 *  yield* call(waitForBackendSetup) // Blocks until the backend lib is ready to receive requests.
 *  yield* call(audiusBackendInstance.doSomething, param)
 * }
 */
export function* waitForBackendSetup() {
  const isBackendSetup = yield* select((store) => store.backend.isSetup)
  const isReachable = yield* select(getIsReachable)
  if (!isBackendSetup && !isReachable) {
    yield* all([
      take(backendActions.SETUP_BACKEND_SUCCEEDED),
      take(reachabilityActions.SET_REACHABLE)
    ])
  } else if (!isReachable) {
    yield* take(reachabilityActions.SET_REACHABLE)
  } else if (!isBackendSetup) {
    yield* take(backendActions.SETUP_BACKEND_SUCCEEDED)
  }
}

function* awaitReachability() {
  const isNativeMobile = yield* getContext('isNativeMobile')
  if (!isNativeMobile) return true
  const { action } = yield* race({
    action: take(reachabilityActions.SET_REACHABLE),
    delay: delay(REACHABILITY_TIMEOUT_MS)
  })
  return !!action
}

export function* setupBackend() {
  const establishedReachability = yield* call(awaitReachability)
  // If we couldn't connect, show the error page
  // and just sit here waiting for reachability.
  if (!establishedReachability) {
    console.error('No internet connectivity')
    yield* put(accountActions.fetchAccountNoInternet())
    yield* take(reachabilityActions.SET_REACHABLE)
    console.info('Reconnected')
  }

  const apiClient = yield* getContext('apiClient')
  const fingerprintClient = yield* getContext('fingerprintClient')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  // Init APICLient
  apiClient.init()
  // Fire-and-forget init fp
  fingerprintClient.init()
  yield* put(accountActions.fetchAccount())
  const { web3Error, libsError } = yield* call(audiusBackendInstance.setup)
  if (libsError) {
    yield* put(accountActions.fetchAccountFailed({ reason: 'LIBS_ERROR' }))
    yield* put(backendActions.setupBackendFailed())
    yield* put(backendActions.libsError(libsError))
    return
  }
  yield* put(backendActions.setupBackendSucceeded(web3Error))
}

function* watchSetupBackend() {
  yield* takeEvery(backendActions.SETUP, setupBackend)
}

export default function sagas() {
  return [watchSetupBackend, watchBackendErrors]
}
