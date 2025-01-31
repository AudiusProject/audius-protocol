import { GetNotificationsValidTypesEnum as ValidTypes } from '@audius/sdk'

import { useFeatureFlag } from '../../hooks/useFeatureFlag'
import { FeatureFlags } from '../../services/remote-config'
import { removeNullable } from '../../utils/typeUtils'

export const useNotificationValidTypes = () => {
  const { isEnabled: isUSDCPurchasesEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )
  const { isEnabled: isCommentsEnabled } = useFeatureFlag(
    FeatureFlags.COMMENTS_ENABLED
  )

  return [
    ValidTypes.RepostOfRepost,
    ValidTypes.SaveOfRepost,
    ValidTypes.TrendingPlaylist,
    ValidTypes.TrendingUnderground,
    ValidTypes.Tastemaker,
    isUSDCPurchasesEnabled ? ValidTypes.UsdcPurchaseBuyer : null,
    isUSDCPurchasesEnabled ? ValidTypes.UsdcPurchaseSeller : null,
    ValidTypes.TrackAddedToPurchasedAlbum,
    ValidTypes.RequestManager,
    ValidTypes.ApproveManagerRequest,
    isCommentsEnabled ? ValidTypes.Comment : null,
    isCommentsEnabled ? ValidTypes.CommentThread : null,
    isCommentsEnabled ? ValidTypes.CommentMention : null,
    isCommentsEnabled ? ValidTypes.CommentReaction : null,
    ValidTypes.ClaimableReward
  ].filter(removeNullable)
}
