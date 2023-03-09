import { FeatureFlags } from '@audius/common'
import { getIsIOS } from 'audius-client/src/utils/browser'

import { useFeatureFlag } from 'app/hooks/useRemoteConfig'

// This will be removed after the launch of collectible gated premium content.
// For now, it helps us handle feature flagging the
// release of collectible gated premium content on different mobile os.
export const useIsCollectibleGatedEnabled = () => {
  const isIos = getIsIOS()
  const { isEnabled: isAndroidGatedContentEnabled } = useFeatureFlag(
    FeatureFlags.ANDROID_GATED_CONTENT_ENABLED
  )
  const { isEnabled: isIosGatedContentEnabled } = useFeatureFlag(
    FeatureFlags.IOS_GATED_CONTENT_ENABLED
  )
  const { isEnabled: isCollectibleGatedEnabled } = useFeatureFlag(
    FeatureFlags.COLLECTIBLE_GATED_ENABLED
  )
  return (
    isCollectibleGatedEnabled &&
    (isIos ? isIosGatedContentEnabled : isAndroidGatedContentEnabled)
  )
}
