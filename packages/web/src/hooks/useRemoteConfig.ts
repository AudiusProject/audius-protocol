import {
  createUseFeatureFlagHook,
  createUseRemoteVarHook,
  accountSelectors,
  remoteConfigSelectors
} from '@audius/common'

import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { useSelector } from 'utils/reducer'
const { isRemoteConfigLoaded } = remoteConfigSelectors
const getAccountUser = accountSelectors.getAccountUser

export const useFlag = createUseFeatureFlagHook({
  remoteConfigInstance,
  getLocalStorageItem: (key: string) => window.localStorage.getItem(key),
  setLocalStorageItem: (key: string, value: string | null) => {
    if (value === null) return window.localStorage.removeItem(key)
    window.localStorage.setItem(key, value)
  },
  useHasAccount: () => !!useSelector(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
export const useRemoteVar = createUseRemoteVarHook({
  remoteConfigInstance,
  useHasAccount: () => !!useSelector(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
