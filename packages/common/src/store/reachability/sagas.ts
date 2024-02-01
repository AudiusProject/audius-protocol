import { takeEvery, select, all, take } from 'typed-redux-saga'

import { getContext } from '~/store/effects'

import * as reachabilityActions from './actions'
import * as reachabilitySelectors from './selectors'

function* watchSetReachable() {
  const apiClient = yield* getContext('apiClient')
  yield* takeEvery(reachabilityActions.SET_REACHABLE, () => {
    apiClient.setIsReachable(true)
  })
}

function* watchSetUnreachable() {
  const apiClient = yield* getContext('apiClient')
  yield* takeEvery(reachabilityActions.SET_UNREACHABLE, () => {
    apiClient.setIsReachable(false)
  })
}

// Wait until reachability is either true or 'unconfirmed'
export function* waitForReachability() {
  const isReachable = yield* select(reachabilitySelectors.getIsReachable)
  if (isReachable !== false) return
  yield* all([take(reachabilityActions.SET_REACHABLE)])
}

export function sagas() {
  return [watchSetReachable, watchSetUnreachable, waitForReachability]
}
