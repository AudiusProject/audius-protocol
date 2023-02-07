import { FeatureFlags, getContext } from '@audius/common'
import { call } from 'typed-redux-saga'

import { OFFLINE_OVERRIDE_STORAGE_KEY } from 'app/constants/storage-keys'

export function* getIsOfflineEnabled() {
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isOfflineModeEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.OFFLINE_MODE_ENABLED
  )

  const localStorage = yield* getContext('localStorage')
  const isOfflineModeEnabledOverride = yield* call(
    [localStorage, localStorage.getItem],
    OFFLINE_OVERRIDE_STORAGE_KEY
  )

  return Boolean(isOfflineModeEnabledOverride ?? isOfflineModeEnabled)
}
