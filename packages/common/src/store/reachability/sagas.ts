import { takeEvery } from 'typed-redux-saga'

import { getContext } from 'store/commonStore'

import * as reachabilityActions from './actions'

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

export function sagas() {
  return [watchSetReachable, watchSetUnreachable]
}
