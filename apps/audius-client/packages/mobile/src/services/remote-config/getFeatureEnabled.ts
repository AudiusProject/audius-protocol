import type { FeatureFlags, OverrideSetting } from '@audius/common'
import { FEATURE_FLAG_OVERRIDE_KEY } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { remoteConfigInstance } from './remote-config-instance'

const getLocalStorageItem = (key: string) => AsyncStorage.getItem(key)

export const getFeatureEnabled = async (flag: FeatureFlags) => {
  const overrideKey = `${FEATURE_FLAG_OVERRIDE_KEY}:${flag}`
  const override = (await getLocalStorageItem?.(overrideKey)) as OverrideSetting
  if (override === 'enabled') return true
  if (override === 'disabled') return false

  return remoteConfigInstance.getFeatureEnabled(flag)
}
