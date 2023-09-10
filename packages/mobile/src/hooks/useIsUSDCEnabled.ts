import { FeatureFlags } from '@audius/common'

import { useFeatureFlag } from './useRemoteConfig'

export const useIsUSDCEnabled = () =>
  useFeatureFlag(FeatureFlags.USDC_PURCHASES).isEnabled
