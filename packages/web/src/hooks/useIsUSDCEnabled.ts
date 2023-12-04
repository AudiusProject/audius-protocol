import { useFeatureFlag, FeatureFlags } from '@audius/common'

export const useIsUSDCEnabled = () =>
  useFeatureFlag(FeatureFlags.USDC_PURCHASES).isEnabled
