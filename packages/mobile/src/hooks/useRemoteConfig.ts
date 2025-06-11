import {
  createUseFeatureFlagHook,
  createUseRemoteVarHook
} from '@audius/common/hooks'
import { remoteConfigSelectors } from '@audius/common/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSelector } from 'react-redux'

import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'
const { isRemoteConfigLoaded } = remoteConfigSelectors

export const useFeatureFlag = createUseFeatureFlagHook({
  remoteConfigInstance,
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded),
  setLocalStorageItem: AsyncStorage.setItem,
  getLocalStorageItem: AsyncStorage.getItem
})

export const useRemoteVar = createUseRemoteVarHook({
  remoteConfigInstance,
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
