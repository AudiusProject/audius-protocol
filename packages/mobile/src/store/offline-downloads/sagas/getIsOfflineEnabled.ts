import { FeatureFlags } from '@audius/common/services'
import { getContext } from '@audius/common/store'
import { call } from 'typed-redux-saga'

import { OFFLINE_OVERRIDE_STORAGE_KEY } from 'app/constants/storage-keys'

export function* getIsOfflineEnabled() {
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call(remoteConfigInstance.waitForRemoteConfig)

  const isOfflineModeEnabled = yield* call(
    remoteConfigInstance.getFeatureEnabled,
    FeatureFlags.OFFLINE_MODE_RELEASE
  )

  const localStorage = yield* getContext('localStorage')
  const isOfflineModeEnabledOverride = yield* call(
    [localStorage, localStorage.getItem],
    OFFLINE_OVERRIDE_STORAGE_KEY
  )

  return Boolean(isOfflineModeEnabledOverride ?? isOfflineModeEnabled)
}
