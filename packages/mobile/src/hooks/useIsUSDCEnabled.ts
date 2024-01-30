import { FeatureFlags } from '@audius/common'
import { useFeatureFlag } from '@audius/common/hooks'

export const useIsUSDCEnabled = () =>
  useFeatureFlag(FeatureFlags.USDC_PURCHASES).isEnabled
