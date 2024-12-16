import {
  accountActions,
  reachabilityActions,
  reachabilitySelectors,
  getContext,
  accountSelectors
} from '@audius/common/store'
import {
  put,
  all,
  take,
  takeEvery,
  select,
  call,
  race,
  delay
} from 'typed-redux-saga'

import { REACHABILITY_LONG_TIMEOUT } from 'store/reachability/sagas'

import * as backendActions from './actions'
import { watchBackendErrors } from './errorSagas'
import { getIsSettingUp, getIsSetup } from './selectors'
const { getIsReachable } = reachabilitySelectors

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

// This is specific to setupBackend. See utils in reachability sagas for general use
export function* awaitReachability() {
  const isNativeMobile = yield* getContext('isNativeMobile')
  const isReachable = yield* select(getIsReachable)
  if (isReachable || !isNativeMobile) return true
  const { action } = yield* race({
    action: take(reachabilityActions.SET_REACHABLE),
    delay: delay(REACHABILITY_LONG_TIMEOUT)
  })
  return !!action
}

export function* setupBackend() {
  // Optimistically fetch account, then do it again later when we're sure we're connected
  // This ensures we always get the cached account when starting offline if available
  yield* put(accountActions.fetchLocalAccount())

  const establishedReachability = yield* call(awaitReachability)
  // If we couldn't connect, just sit here waiting for reachability.
  if (!establishedReachability) {
    console.warn('No internet connectivity')
    yield* put(accountActions.fetchAccountNoInternet())
    yield* take(reachabilityActions.SET_REACHABLE)
    console.info('Reconnected')
  }

  const fingerprintClient = yield* getContext('fingerprintClient')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  // Fire-and-forget init fp
  fingerprintClient.init()

  // Check for cached local account so we can use it to initialize backend
  const fetchLocalAccountResult = yield* race({
    failure: take(accountActions.fetchAccountFailed),
    success: take(accountActions.fetchAccountSucceeded)
  })

  let setupArgs = {}
  if (fetchLocalAccountResult.success) {
    const localUser = yield* select(accountSelectors.getAccountUser)
    if (localUser) {
      setupArgs = {
        wallet: localUser.wallet,
        userId: localUser.user_id
      }
    }
  }

  // Start remote account fetch while we setup backend
  yield* put(accountActions.fetchAccount())

  const { web3Error, libsError } = yield* call(
    audiusBackendInstance.setup,
    setupArgs
  )

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

// If not fully set up, re set-up the backend
export function* setupBackendIfNotSetUp() {
  const isSetup = yield* select(getIsSetup)
  const isSettingUp = yield* select(getIsSettingUp)
  if (!isSetup && !isSettingUp) {
    // Try to set up again, which should block further actions until completed
    yield* put(backendActions.setupBackend())
  }
}

function* watchSetReachable() {
  yield* takeEvery(reachabilityActions.SET_REACHABLE, setupBackendIfNotSetUp)
}

function* init() {
  yield* put(backendActions.setupBackend())
}

export default function sagas() {
  return [init, watchSetupBackend, watchBackendErrors, watchSetReachable]
}
