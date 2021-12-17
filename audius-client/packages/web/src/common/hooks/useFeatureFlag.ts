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

/**
 * Hooks into updates for a given feature flag.
 * Returns both `isLoaded` and `isEnabled` for more granular control
 * @param flag
 */
export const createUseFeatureFlagHook = <State extends StateWithRemoteConfig>(
  remoteConfigInstance: RemoteConfigInstance
) => (flag: FeatureFlags) => {
  const configLoaded = useSelector((state: State) =>
    isRemoteConfigLoaded<State>(state)
  )
  const userIdFlag = flagCohortType[flag] === FeatureFlagCohortType.USER_ID
  const hasAccount = useSelector(getAccountUser)
  const shouldRecompute = userIdFlag ? hasAccount : true
  const isEnabled = useMemo(
    () => remoteConfigInstance.getFeatureEnabled(flag),
    // We want configLoaded and shouldRecompute to trigger refreshes of the memo
    // eslint-disable-next-line
    [flag, configLoaded, shouldRecompute]
  )
  return { isLoaded: configLoaded, isEnabled }
}
