import {
  createUseFeatureFlagHook,
  createUseRemoteVarHook,
  accountSelectors,
  remoteConfigSelectors
} from '@audius/common'
import { useSelector } from 'react-redux'

import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'
const { isRemoteConfigLoaded } = remoteConfigSelectors
const { getAccountUser } = accountSelectors

export const useFeatureFlag = createUseFeatureFlagHook({
  remoteConfigInstance,
  useHasAccount: () => !!useSelector(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})

export const useRemoteVar = createUseRemoteVarHook({
  remoteConfigInstance,
  useHasAccount: () => !!useSelector(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
