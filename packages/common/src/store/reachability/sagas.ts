import { takeEvery, select, all, take } from 'typed-redux-saga'

import { getContext } from '~/store/effects'

import * as reachabilityActions from './actions'
import * as reachabilitySelectors from './selectors'

// Wait until reachability is either true or 'unconfirmed'
export function* waitForReachability() {
  const isReachable = yield* select(reachabilitySelectors.getIsReachable)
  if (isReachable !== false) return
  yield* all([take(reachabilityActions.SET_REACHABLE)])
}

export function sagas() {
  return [waitForReachability]
}
