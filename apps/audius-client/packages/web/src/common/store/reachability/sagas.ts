import {
  reachabilityActions,
  reachabilitySelectors,
  getContext
} from '@audius/common'
import { take, select, call } from 'typed-redux-saga'

const { getIsReachable } = reachabilitySelectors

export function* getReachability() {
  return yield* select(getIsReachable)
}

export function* awaitReachability() {
  const isNativeMobile = yield* getContext('isNativeMobile')
  const isReachable = yield* call(getReachability)
  if (isReachable || !isNativeMobile) return
  yield* take(reachabilityActions.SET_REACHABLE)
}
