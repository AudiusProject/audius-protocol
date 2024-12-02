import {
  notificationFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { Id } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors, getContext, getSDK } from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import { GetNotificationsValidTypesEnum as ValidTypes } from '@audius/sdk'
import { call, select } from 'typed-redux-saga'

type FetchNotificationsParams = {
  limit: number
  timeOffset?: number // unix timestamp
  groupIdOffset?: string
}

export function* fetchNotifications(config: FetchNotificationsParams) {
  const {
    limit,
    timeOffset = Math.round(new Date().getTime() / 1000), // current unix timestamp (sec)
    groupIdOffset
  } = config

  const sdk = yield* getSDK()
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const userId = yield* select(accountSelectors.getUserId)
  const encodedUserId = Id.parse(userId)

  const isUSDCPurchasesEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.USDC_PURCHASES
  )

  const isCommentsEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.COMMENTS_ENABLED
  )

  const validTypes = [
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

  const { data } = yield* call(
    [sdk.full.notifications, sdk.full.notifications.getNotifications],
    {
      timestamp: timeOffset,
      groupId: groupIdOffset,
      validTypes,
      userId: encodedUserId,
      limit
    }
  )
  const notifications = data
    ? transformAndCleanList(data.notifications, notificationFromSDK)
    : []

  return { notifications, totalUnviewed: data?.unreadCount ?? 0 }
}
