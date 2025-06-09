import { IntKeys } from '@audius/common/services'
import { cacheActions, getContext } from '@audius/common/store'
import { call, put } from 'typed-redux-saga'

function* initializeCacheType() {
  const remoteConfig = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfig.waitForRemoteConfig)

  const cacheEntryTTL = remoteConfig.getRemoteVar(IntKeys.CACHE_ENTRY_TTL)!

  yield* put(
    cacheActions.setCacheConfig({
      entryTTL: cacheEntryTTL
    })
  )
}

const sagas = () => {
  return [initializeCacheType]
}

export default sagas
