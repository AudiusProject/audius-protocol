import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { merge } from 'lodash'
export const useMessages = <
  A extends Record<string, unknown>,
  B extends Record<string, unknown>
>(
  // prioritized when the feature flag is off
  messages1: A,
  // prioritized when the feature flag is on
  messages2: B,
  flag: FeatureFlags
) => {
  const { isEnabled } = useFeatureFlag(flag)

  return isEnabled ? merge(messages1, messages2) : merge(messages2, messages1)
}
