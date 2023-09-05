import { useCallback, useEffect, useMemo, useState } from 'react'

import { FeatureFlags, RemoteConfigInstance } from '../services'

export const FEATURE_FLAG_OVERRIDE_KEY = 'FeatureFlagOverride'

export type OverrideSetting = 'enabled' | 'disabled' | null

/**
 * Helper for when to recompute flag state, used by both FeatureFlags
 * and RemoteConfig. Returns a boolean that toggles whenever it should recompute (i.e. for use in `useEffect`)
 * Recomputes when:
 * - User logs in (account is seen in store)
 * - Config loads
 * - User ID is set on Optimizely (seen by event emission)
 **/
export const useRecomputeToggle = (
  useHasAccount: () => boolean,
  configLoaded: boolean,
  remoteConfigInstance: RemoteConfigInstance
) => {
  const [recomputeToggle, setRecomputeToggle] = useState(false)

  const hasAccount = useHasAccount()

  // Flip recompute bool whenever account or config state changes
  useEffect(() => {
    setRecomputeToggle((recompute) => !recompute)
  }, [hasAccount, configLoaded])

  // Register callback for remote config account set,
  // which flips recompute bool
  const onUserStateChange = useCallback(() => {
    setRecomputeToggle((recompute) => !recompute)
  }, [])

  useEffect(() => {
    remoteConfigInstance.listenForUserId(onUserStateChange)
    return () => remoteConfigInstance.unlistenForUserId(onUserStateChange)
  }, [onUserStateChange, remoteConfigInstance])

  return recomputeToggle
}

/**
 * Hooks into updates for a given feature flag.
 * Returns both `isLoaded` and `isEnabled` for more granular control
 * @param flag
 */
export const createUseFeatureFlagHook =
  ({
    remoteConfigInstance,
    getLocalStorageItem,
    setLocalStorageItem,
    useHasAccount,
    useHasConfigLoaded
  }: {
    remoteConfigInstance: RemoteConfigInstance
    getLocalStorageItem?: (key: string) => string | null
    setLocalStorageItem?: (key: string, value: string | null) => void
    useHasAccount: () => boolean
    useHasConfigLoaded: () => boolean
  }) =>
  (flag: FeatureFlags) => {
    const overrideKey = `${FEATURE_FLAG_OVERRIDE_KEY}:${flag}`
    const configLoaded = useHasConfigLoaded()

    const shouldRecompute = useRecomputeToggle(
      useHasAccount,
      configLoaded,
      remoteConfigInstance
    )

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
      [flag, shouldRecompute]
    )
    return { isLoaded: configLoaded, isEnabled, setOverride }
  }
