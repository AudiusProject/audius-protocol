import {
  createUseFeatureFlagHook,
  createUseRemoteVarHook
} from '@audius/common/hooks'
import { remoteConfigSelectors } from '@audius/common/store'

import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { useSelector } from 'utils/reducer'
const { isRemoteConfigLoaded } = remoteConfigSelectors

export const useFlag = createUseFeatureFlagHook({
  remoteConfigInstance,
  getLocalStorageItem: async (key: string) => window.localStorage.getItem(key),
  setLocalStorageItem: async (key: string, value: string | null) => {
    if (value === null) return window.localStorage.removeItem(key)
    window.localStorage.setItem(key, value)
  },
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
export const useRemoteVar = createUseRemoteVarHook({
  remoteConfigInstance,
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
