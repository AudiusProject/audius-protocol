import { FeatureFlags } from '@audius/common'
import { getIsIOS } from 'audius-client/src/utils/browser'

import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

// This will be removed after the launch of special access content.
// For now, it helps us handle feature flagging the
// release of special access content on different mobile os.
export const useIsSpecialAccessGateEnabled = () => {
  const isIos = getIsIOS()
  const { isEnabled: isAndroidPremiumContentEnabled } = useFeatureFlag(
    FeatureFlags.ANDROID_PREMIUM_CONTENT_ENABLED
  )
  const { isEnabled: isIosPremiumContentEnabled } = useFeatureFlag(
    FeatureFlags.IOS_PREMIUM_CONTENT_ENABLED
  )
  return (
    useFeatureFlag(FeatureFlags.SPECIAL_ACCESS_GATE_ENABLED) &&
    (isIos ? isIosPremiumContentEnabled : isAndroidPremiumContentEnabled)
  )
}
