import {
  reachabilityActions,
  reachabilitySelectors,
  getContext,
  accountActions,
  waitForValue
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
import { getIsSetup } from './selectors'
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
  const isReachable = yield* select(getIsReachable)
  if (isReachable || !isNativeMobile) return true
  const { action } = yield* race({
    action: take(reachabilityActions.SET_REACHABLE),
    delay: delay(REACHABILITY_TIMEOUT_MS)
  })
  return !!action
}

export function* setupBackend() {
  // Optimistically fetch account, then do it again later when we're sure we're connected
  // This ensures we always get the cached account when starting offline if available
  yield* put(accountActions.fetchLocalAccount())
  const establishedReachability = yield* call(awaitReachability)
  // If we couldn't connect, show the error page
  // and just sit here waiting for reachability.
  if (!establishedReachability) {
    console.warn('No internet connectivity')
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
  const isReachable = yield* select(getIsReachable)
  // Bail out before success if we are now offline
  // This happens when we started the app with the device offline because
  // we optimistically assume the device is connected to optimize for the "happy path"
  if (!isReachable) return
  yield* put(backendActions.setupBackendSucceeded(web3Error))
}

function* watchSetupBackend() {
  yield* takeEvery(backendActions.SETUP, setupBackend)
}

// Watch for changes to reachability and if not fully set up, re set-up the backend
function* watchReachabilityChange() {
  yield* call(waitForValue, (state) => !getIsReachable(state))
  const isSetup = yield* select(getIsSetup)
  if (!isSetup) {
    yield* call(waitForValue, (state) => getIsReachable(state))
    // Try to set up again, which should block further actions until completed
    yield* put(backendActions.setupBackend())
  }
}

export default function sagas() {
  return [watchSetupBackend, watchBackendErrors, watchReachabilityChange]
}
