import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

export const useIsUSDCEnabled = () =>
  useFeatureFlag(FeatureFlags.USDC_PURCHASES).isEnabled
