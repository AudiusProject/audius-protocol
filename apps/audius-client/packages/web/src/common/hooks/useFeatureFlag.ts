import { useMemo } from 'react'

import { useSelector } from 'react-redux'

import {
  FeatureFlags,
  FeatureFlagCohortType,
  RemoteConfigInstance,
  flagCohortType
} from 'common/services/remote-config'
import { getAccountUser } from 'common/store/account/selectors'
import { isRemoteConfigLoaded } from 'common/store/remote-config/selectors'
import { StateWithRemoteConfig } from 'common/store/remote-config/slice'

export const FEATURE_FLAG_OVERRIDE_KEY = 'FeatureFlagOverride'

export type OverrideSetting = 'enabled' | 'disabled' | null

/**
 * Hooks into updates for a given feature flag.
 * Returns both `isLoaded` and `isEnabled` for more granular control
 * @param flag
 */
export const createUseFeatureFlagHook =
  <State extends StateWithRemoteConfig>({
    remoteConfigInstance,
    getLocalStorageItem,
    setLocalStorageItem
  }: {
    remoteConfigInstance: RemoteConfigInstance
    getLocalStorageItem?: (key: string) => string | null
    setLocalStorageItem?: (key: string, value: string | null) => void
  }) =>
  (flag: FeatureFlags) => {
    const overrideKey = `${FEATURE_FLAG_OVERRIDE_KEY}:${flag}`
    const configLoaded = useSelector((state: State) =>
      isRemoteConfigLoaded<State>(state)
    )
    const userIdFlag = flagCohortType[flag] === FeatureFlagCohortType.USER_ID
    const hasAccount = useSelector(getAccountUser)
    const shouldRecompute = userIdFlag ? hasAccount : true
    const setOverride = (value: OverrideSetting) => {
      setLocalStorageItem?.(overrideKey, value)
    }
    const isEnabled = useMemo(
      () => {
        const override = getLocalStorageItem?.(overrideKey) as OverrideSetting
        if (override === 'enabled') return true
        if (override === 'disabled') return false

        return remoteConfigInstance.getFeatureEnabled(flag)
      },
      // We want configLoaded and shouldRecompute to trigger refreshes of the memo
      // eslint-disable-next-line
    [flag, configLoaded, shouldRecompute]
    )
    return { isLoaded: configLoaded, isEnabled, setOverride }
  }
