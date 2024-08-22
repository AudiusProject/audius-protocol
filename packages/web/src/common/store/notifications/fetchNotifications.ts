import {
  notificationFromSDK,
  transformAndCleanList
} from '@audius/common/adapters'
import { Id } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors, getContext, getSDK } from '@audius/common/store'
import { compareSDKResponse, removeNullable } from '@audius/common/utils'
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

  return yield* call(fetchDiscoveryNotifications, {
    limit,
    timeOffset,
    groupIdOffset
  })
}

function* fetchDiscoveryNotifications(params: FetchNotificationsParams) {
  const { timeOffset, groupIdOffset, limit } = params
  const sdk = yield* getSDK()
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const userId = yield* select(accountSelectors.getUserId)
  const encodedUserId = Id.parse(userId)

  const isRepostOfRepostEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.REPOST_OF_REPOST_NOTIFICATIONS
  )
  const isSaveOfRepostEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.SAVE_OF_REPOST_NOTIFICATIONS
  )
  const isTrendingPlaylistEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.TRENDING_PLAYLIST_NOTIFICATIONS
  )
  const isTrendingUndergroundEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.TRENDING_UNDERGROUND_NOTIFICATIONS
  )
  const isTastemakerEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.TASTEMAKER_NOTIFICATIONS
  )

  const isUSDCPurchasesEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.USDC_PURCHASES
  )

  const isPurchaseableAlbumsEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.PREMIUM_ALBUMS_ENABLED
  )

  const isManagerModeEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.MANAGER_MODE
  )

  const validTypes = [
    isRepostOfRepostEnabled ? 'repost_of_repost' : null,
    isSaveOfRepostEnabled ? 'save_of_repost' : null,
    isTrendingPlaylistEnabled ? 'trending_playlist' : null,
    isTrendingUndergroundEnabled ? 'trending_underground' : null,
    isTastemakerEnabled ? 'tastemaker' : null,
    isUSDCPurchasesEnabled ? 'usdc_purchase_buyer' : null,
    isUSDCPurchasesEnabled ? 'usdc_purchase_seller' : null,
    isPurchaseableAlbumsEnabled ? 'track_added_to_purchased_album' : null,
    isManagerModeEnabled ? 'request_manager' : null,
    isManagerModeEnabled ? 'approve_manager_request' : null,
    'claimable_reward'
  ].filter(removeNullable)

  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const legacyResponse = yield* call(
    audiusBackendInstance.getDiscoveryNotifications,
    {
      timestamp: timeOffset,
      groupIdOffset,
      limit,
      validTypes
    }
  )
  const legacy = {
    notifications: legacyResponse.notifications,
    totalUnviewed: legacyResponse.totalUnviewed
  }

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

  const migrated = { notifications, totalUnviewed: data?.unreadCount ?? 0 }
  try {
    console.debug(data?.notifications)
    compareSDKResponse({ legacy, migrated }, 'getNotifications')
  } catch (e) {
    console.error(e)
  }
  return migrated
}
