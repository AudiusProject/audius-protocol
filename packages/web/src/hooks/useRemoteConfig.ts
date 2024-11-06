import {
  createUseFeatureFlagHook,
  createUseRemoteVarHook
} from '@audius/common/hooks'
import { accountSelectors, remoteConfigSelectors } from '@audius/common/store'

import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { useSelector } from 'utils/reducer'
const { isRemoteConfigLoaded } = remoteConfigSelectors
const { getHasAccount } = accountSelectors

export const useFlag = createUseFeatureFlagHook({
  remoteConfigInstance,
  getLocalStorageItem: async (key: string) => window.localStorage.getItem(key),
  setLocalStorageItem: async (key: string, value: string | null) => {
    if (value === null) return window.localStorage.removeItem(key)
    window.localStorage.setItem(key, value)
  },
  useHasAccount: () => useSelector(getHasAccount),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
export const useRemoteVar = createUseRemoteVarHook({
  remoteConfigInstance,
  useHasAccount: () => useSelector(getHasAccount),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
