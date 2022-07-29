import { FeatureFlags } from '@audius/common'

import {
  FEATURE_FLAG_OVERRIDE_KEY,
  OverrideSetting
} from 'common/hooks/useFeatureFlag'

import { remoteConfigInstance } from './remote-config-instance'

const getLocalStorageItem = (key: string) => window.localStorage.getItem(key)

export const getFeatureEnabled = (flag: FeatureFlags) => {
  const overrideKey = `${FEATURE_FLAG_OVERRIDE_KEY}:${flag}`
  const override = getLocalStorageItem?.(overrideKey) as OverrideSetting
  if (override === 'enabled') return true
  if (override === 'disabled') return false

  return remoteConfigInstance.getFeatureEnabled(flag)
}
