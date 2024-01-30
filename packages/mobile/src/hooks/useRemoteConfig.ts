import { accountSelectors, remoteConfigSelectors } from '@audius/common'
import {
  createUseFeatureFlagHook,
  createUseRemoteVarHook
} from '@audius/common/hooks'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSelector } from 'react-redux'

import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'
const { isRemoteConfigLoaded } = remoteConfigSelectors
const { getAccountUser } = accountSelectors

export const useFeatureFlag = createUseFeatureFlagHook({
  remoteConfigInstance,
  useHasAccount: () => !!useSelector(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded),
  setLocalStorageItem: AsyncStorage.setItem,
  getLocalStorageItem: AsyncStorage.getItem
})

export const useRemoteVar = createUseRemoteVarHook({
  remoteConfigInstance,
  useHasAccount: () => !!useSelector(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
