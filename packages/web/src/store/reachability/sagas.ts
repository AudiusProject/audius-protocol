import {
  reachabilityActions,
  reachabilitySelectors,
  getContext
} from '@audius/common/store'
import { delay, race, put, all, take, select, call } from 'typed-redux-saga'

import { isMobileWeb } from 'common/utils/isMobileWeb'

const { getIsReachable } = reachabilitySelectors
const { setUnreachable, setReachable } = reachabilityActions

// Property values borrowed from
// https://github.com/react-native-community/react-native-netinfo
export const REACHABILITY_LONG_TIMEOUT = 10 * 1000 // 10s
const REACHABILITY_SHORT_TIMEOUT = 5 * 1000 // 5s
const REACHABILITY_REQUEST_TIMEOUT = 15 * 1000 // 15s

// Check that a response from REACHABILITY_URL is valid
const isResponseValid = (response: Response | undefined) =>
  response && response.ok

function* ping() {
  const { REACHABILITY_URL } = yield* getContext('env')
  // If there's no reachability url available, consider ourselves reachable
  if (!REACHABILITY_URL) {
    console.warn('No reachability url provided')
    return true
  }

  try {
    const { response } = yield* race({
      response: call(fetch, REACHABILITY_URL, { method: 'GET' }),
      timeout: delay(REACHABILITY_REQUEST_TIMEOUT)
    })

    if (isResponseValid(response)) {
      console.debug('Reachability call succeeded')
      return true
    }
    console.debug('Reachability call failed')
    return false
  } catch {
    console.debug('Reachability call failed')
    return false
  }
}

// Wait until reachability is either true or 'unconfirmed'
export function* waitForReachability() {
  const isReachable = yield* select(getIsReachable)
  if (isReachable !== false) return
  yield* all([take(reachabilityActions.SET_REACHABLE)])
}

// Wait until reachability is true. 'unconfirmed' is not good enough
export function* waitForConfirmedReachability() {
  const isReachable = yield* select(getIsReachable)
  if (isReachable === true) return
  yield* all([take(reachabilityActions.SET_REACHABLE)])
}

/** Updates the reachability setting in the store and log-warns of any change. */
function* updateReachability(isReachable: boolean) {
  const wasReachable = yield* select(getIsReachable)
  if (isReachable) {
    if (!wasReachable) {
      // not reachable => reachable
      console.warn('App transitioned to reachable state')
    }
    yield* put(setReachable())
  } else {
    if (wasReachable) {
      // reachable => not reachable
      console.warn('App transitioned to unreachable state')
    }
    yield* put(setUnreachable())
  }
}

// Note: We don't have an equivalent saga in native mobile because the reachability state is updated via the event listener
// registered in apps/mobile/utils/connectivity.ts
function* reachabilityPollingDaemon() {
  // Web/Desktop: poll for connectivity
  if (!isMobileWeb()) {
    // TODO: Remove this check when we have build out reachability UI for desktop.
    yield* put(setReachable())
    return
  }

  let failures = 0
  while (true) {
    const isReachable = yield* call(ping)
    if (!isReachable) failures += 1
    if (isReachable) failures = 0
    yield* call(updateReachability, failures < 2)

    yield* delay(
      isReachable ? REACHABILITY_LONG_TIMEOUT : REACHABILITY_SHORT_TIMEOUT
    )
  }
}

export default function sagas() {
  return [reachabilityPollingDaemon]
}
