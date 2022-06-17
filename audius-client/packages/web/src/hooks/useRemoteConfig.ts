import { createUseFeatureFlagHook } from 'common/hooks/useFeatureFlag'
import { createUseRemoteVarHook } from 'common/hooks/useRemoteVar'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

export const useFlag = createUseFeatureFlagHook({
  remoteConfigInstance,
  getLocalStorageItem: (key: string) => window.localStorage.getItem(key),
  setLocalStorageItem: (key: string, value: string | null) => {
    if (value === null) return window.localStorage.removeItem(key)
    window.localStorage.setItem(key, value)
  }
})
export const useRemoteVar = createUseRemoteVarHook(remoteConfigInstance)
