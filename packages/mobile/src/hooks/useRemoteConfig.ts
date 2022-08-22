import {
  createUseFeatureFlagHook,
  createUseRemoteVarHook,
  accountSelectors,
  remoteConfigSelectors
} from '@audius/common'
import { useSelector } from 'react-redux'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'
const { isRemoteConfigLoaded } = remoteConfigSelectors
const getAccountUser = accountSelectors.getAccountUser

export const useFeatureFlag = createUseFeatureFlagHook({
  remoteConfigInstance,
  useHasAccount: () => !!useSelectorWeb(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})

export const useRemoteVar = createUseRemoteVarHook({
  remoteConfigInstance,
  useHasAccount: () => !!useSelectorWeb(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
