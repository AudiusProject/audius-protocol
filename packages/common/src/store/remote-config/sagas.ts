import { call, put } from 'typed-redux-saga'

import { getContext } from '../effects'

import { setDidLoad } from './slice'

function* watchRemoteConfigLoad() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')

  yield* call(remoteConfigInstance.waitForRemoteConfig)
  yield* put(setDidLoad())
}

const remoteConfigSagas = () => {
  return [watchRemoteConfigLoad]
}

export default remoteConfigSagas
