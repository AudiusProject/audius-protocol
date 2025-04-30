import { FeatureFlags } from '@audius/common/services'

export const createMockRemoteConfig = (
  featureFlags: Partial<Record<FeatureFlags, boolean>> = {}
) => ({
  getFeatureEnabled: (flag: FeatureFlags, fallbackFlag?: FeatureFlags) => {
    return (
      featureFlags[flag] ?? featureFlags[fallbackFlag as FeatureFlags] ?? false
    )
  },
  getRemoteVar: () => null,
  waitForRemoteConfig: async () => {},
  waitForUserRemoteConfig: async () => {},
  getEagerRemoteConfig: () => null,
  setUserId: () => {},
  listenForUserId: () => {},
  unlistenForUserId: () => {},
  init: async () => {}
})
