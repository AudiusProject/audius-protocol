import {
  notificationFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors, getContext, getSDK } from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import { Id, GetNotificationsValidTypesEnum as ValidTypes } from '@audius/sdk'
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

  const isOneShotEnabled = yield* call(getFeatureEnabled, FeatureFlags.ONE_SHOT)
  const isListenStreakEndlessEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.LISTEN_STREAK_ENDLESS
  )

  const validTypes = [
    ValidTypes.RepostOfRepost,
    ValidTypes.SaveOfRepost,
    ValidTypes.TrendingPlaylist,
    ValidTypes.TrendingUnderground,
    ValidTypes.Tastemaker,
    ValidTypes.UsdcPurchaseBuyer,
    ValidTypes.UsdcPurchaseSeller,
    ValidTypes.TrackAddedToPurchasedAlbum,
    ValidTypes.RequestManager,
    ValidTypes.ApproveManagerRequest,
    ValidTypes.Comment,
    ValidTypes.CommentThread,
    ValidTypes.CommentMention,
    ValidTypes.CommentReaction,
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

  const oneShotFilteredNotifications = isOneShotEnabled
    ? notifications
    : notifications.filter((n) => !n.groupId?.includes('challenge:o'))

  const listenStreakEndlessFilteredNotifications = isListenStreakEndlessEnabled
    ? oneShotFilteredNotifications
    : oneShotFilteredNotifications.filter(
        (n) => !n.groupId?.includes('challenge:e')
      )

  return {
    notifications: listenStreakEndlessFilteredNotifications,
    totalUnviewed: data?.unreadCount ?? 0
  }
}
