import {
  put,
  all,
  delay,
  take,
  takeEvery,
  select,
  call,
  race
} from 'redux-saga/effects'

import * as accountActions from 'common/store/account/reducer'
import * as reachabilityActions from 'common/store/reachability/actions'
import { getIsReachable } from 'common/store/reachability/selectors'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import fingerprintClient from 'services/fingerprint/FingerprintClient'
import { RequestNetworkConnected } from 'services/native-mobile-interface/lifecycle'
import * as backendActions from 'store/backend/actions'

import { watchBackendErrors } from './errorSagas'
const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const REACHABILITY_TIMEOUT_MS = 8 * 1000

/**
 * Waits for the backend to be setup. Can be used as a blocking call in another saga,
 * For example:
 * function * saga () {
 *  yield call(waitForBackendSetup) // Blocks until the backend lib is ready to receive requests.
 *  yield call(audiusBackendInstance.doSomething, param)
 * }
 */
export function* waitForBackendSetup() {
  const isBackendSetup = yield select((store) => store.backend.isSetup)
  const isReachable = yield select(getIsReachable)
  if (!isBackendSetup && !isReachable) {
    yield all([
      take(backendActions.SETUP_BACKEND_SUCCEEDED),
      take(reachabilityActions.SET_REACHABLE)
    ])
  } else if (!isReachable) {
    yield take(reachabilityActions.SET_REACHABLE)
  } else if (!isBackendSetup) {
    yield take(backendActions.SETUP_BACKEND_SUCCEEDED)
  }
}

function* awaitReachability() {
  if (!NATIVE_MOBILE) return true
  // Request network connection information.
  // If we don't ask the native layer for it, it's possible that we never receive
  // and update.
  const message = new RequestNetworkConnected()
  message.send()

  const { action } = yield race({
    action: take(reachabilityActions.SET_REACHABLE),
    delay: delay(REACHABILITY_TIMEOUT_MS)
  })

  return !!action
}

export function* setupBackend() {
  const establishedReachability = yield call(awaitReachability)

  // If we couldn't connect, show the error page
  // and just sit here waiting for reachability.
  if (!establishedReachability) {
    console.error('No internet connectivity')
    yield put(accountActions.fetchAccountNoInternet())
    yield take(reachabilityActions.SET_REACHABLE)
    console.info('Reconnected')
  }

  // Init APICLient
  yield call(() => apiClient.init())
  // Fire-and-forget init fp
  fingerprintClient.init()
  yield put(accountActions.fetchAccount())
  const { web3Error, libsError } = yield call(audiusBackendInstance.setup)
  if (libsError) {
    yield put(accountActions.fetchAccountFailed({ reason: 'LIBS_ERROR' }))
    yield put(backendActions.setupBackendFailed())
    yield put(backendActions.libsError(libsError))
    return
  }
  yield put(backendActions.setupBackendSucceeded(web3Error))
}

function* watchSetupBackend() {
  yield takeEvery(backendActions.SETUP, setupBackend)
}

export default function sagas() {
  return [watchSetupBackend, watchBackendErrors]
}
