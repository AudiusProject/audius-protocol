import { FeatureFlags } from '@audius/common'

import { useFlag } from './useRemoteConfig'

export const useIsUSDCEnabled = () =>
  useFlag(FeatureFlags.USDC_PURCHASES).isEnabled
