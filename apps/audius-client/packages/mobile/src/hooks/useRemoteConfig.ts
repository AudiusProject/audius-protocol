import { useMemo } from 'react'

// import { createUseFeatureFlagHook } from 'audius-client/src/common/hooks/useFeatureFlag'
// import { createUseRemoteVarHook } from 'audius-client/src/common/hooks/useRemoteVar'

import { FeatureFlagCohortType, flagCohortType } from '@audius/common'
import type {
  AllRemoteConfigKeys,
  BooleanKeys,
  DoubleKeys,
  IntKeys,
  StringKeys,
  FeatureFlags
} from '@audius/common'
import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { isRemoteConfigLoaded } from 'audius-client/src/common/store/remote-config/selectors'
import { useSelector } from 'react-redux'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'

// Duplicating these hooks here instead of using `createUseFeatureFlagHook` and `createUseRemoteVarHook`
// because the react version mismatch between audius-mobile-client and audius-client is causing
// any hooks imported from audius-client to throw an "Invalid hook call" error.
// When the react versions are matched, this can be updated

// export const useFlag = createUseFeatureFlagHook(remoteConfigInstance)
// export const useRemoteVar = createUseRemoteVarHook(remoteConfigInstance)

export const useFeatureFlag = (flag: FeatureFlags) => {
  const configLoaded = useSelector(isRemoteConfigLoaded)
  const userIdFlag = flagCohortType[flag] === FeatureFlagCohortType.USER_ID
  const hasAccount = useSelectorWeb(getAccountUser)
  const shouldRecompute = userIdFlag ? hasAccount : true
  const isEnabled = useMemo(
    () => remoteConfigInstance.getFeatureEnabled(flag),
    // We want configLoaded and shouldRecompute to trigger refreshes of the memo
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flag, configLoaded, shouldRecompute]
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const remoteVar = useMemo(
    () => remoteConfigInstance.getRemoteVar(key),
    [key, configLoaded, remoteConfigInstance]
  )
  return remoteVar
}
