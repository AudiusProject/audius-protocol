import {
  createUseFeatureFlagHook,
  createUseRemoteVarHook
} from '@audius/common'

import { getAccountUser } from 'common/store/account/selectors'
import { isRemoteConfigLoaded } from 'common/store/remote-config/selectors'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { useSelector } from 'utils/reducer'

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
