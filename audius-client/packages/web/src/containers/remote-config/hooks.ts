import { useMemo } from 'react'

import { getAccountUser } from 'common/store/account/selectors'
import {
  getFeatureEnabled,
  FeatureFlags,
  AllRemoteConfigKeys,
  getRemoteVar,
  BooleanKeys,
  IntKeys,
  DoubleKeys,
  StringKeys
} from 'services/remote-config'
import {
  FeatureFlagCohortType,
  flagCohortType
} from 'services/remote-config/FeatureFlags'
import { useSelector } from 'utils/reducer'

import { isRemoteConfigLoaded } from './selectors'

/**
 * Hooks into updates for a given feature flag.
 * Returns both `isLoaded` and `isEnabled` for more granular control
 * @param flag
 */
export const useFlag = (flag: FeatureFlags) => {
  const configLoaded = useSelector(isRemoteConfigLoaded)
  const userIdFlag = flagCohortType[flag] === FeatureFlagCohortType.USER_ID
  const hasAccount = useSelector(getAccountUser)
  const shouldRecompute = userIdFlag ? hasAccount : true
  const isEnabled = useMemo(
    // We want configLoaded and shouldRecompute to trigger refreshes of the memo
    // eslint-disable-next-line
    () => getFeatureEnabled(flag), [flag, configLoaded, shouldRecompute]
  )
  return { isLoaded: configLoaded, isEnabled }
}

export function useRemoteVar(key: IntKeys): number
export function useRemoteVar(key: DoubleKeys): number
export function useRemoteVar(key: StringKeys): string
export function useRemoteVar(key: BooleanKeys): boolean
export function useRemoteVar(
  key: AllRemoteConfigKeys
): boolean | string | number | null {
  const configLoaded = useSelector(isRemoteConfigLoaded)
  // eslint complains about configLoaded as part of the deps array
  // eslint-disable-next-line
  const remoteVar = useMemo(() => getRemoteVar(key), [key, configLoaded])
  return remoteVar
}

export const useArePlaylistUpdatesEnabled = () => {
  return useFlag(FeatureFlags.PLAYLIST_UPDATES_ENABLED)
}
