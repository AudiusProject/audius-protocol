import { Id } from '@audius/sdk'
import { useInfiniteQuery } from '@tanstack/react-query'

import { notificationFromSDK, transformAndCleanList } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models/Identifiers'
import {
  Entity,
  NotificationType,
  Notification
} from '~/store/notifications/types'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCollections } from './useCollections'
import { useCurrentUserId } from './useCurrentUserId'
import { useNotificationValidTypes } from './useNotificationValidTypes'
import { useTracks } from './useTracks'
import { useUsers } from './useUsers'

const DEFAULT_LIMIT = 20
const USER_INITIAL_LOAD_COUNT = 9

type PageParam = {
  timestamp: number
  groupId: string
} | null

type EntityIds = {
  userIds: Set<ID>
  trackIds: Set<ID>
  collectionIds: Set<ID>
}

const collectEntityIds = (notifications: Notification[]): EntityIds => {
  const trackIds = new Set<ID>()
  const collectionIds = new Set<ID>()
  const userIds = new Set<ID>()

  notifications.forEach((notification) => {
    const { type } = notification
    if (type === NotificationType.UserSubscription) {
      if (notification.entityType === Entity.Track) {
        notification.entityIds.forEach((id) => trackIds.add(id))
      } else if (
        notification.entityType === Entity.Playlist ||
        notification.entityType === Entity.Album
      ) {
        notification.entityIds.forEach((id) => collectionIds.add(id))
      }
      userIds.add(notification.userId)
    }
    if (
      type === NotificationType.Repost ||
      type === NotificationType.RepostOfRepost ||
      type === NotificationType.Favorite ||
      type === NotificationType.FavoriteOfRepost ||
      (type === NotificationType.Milestone && 'entityType' in notification)
    ) {
      if (notification.entityType === Entity.Track) {
        trackIds.add(notification.entityId)
      } else if (
        notification.entityType === Entity.Playlist ||
        notification.entityType === Entity.Album
      ) {
        collectionIds.add(notification.entityId)
      } else if (notification.entityType === Entity.User) {
        userIds.add(notification.entityId)
      }
    }
    if (
      type === NotificationType.Follow ||
      type === NotificationType.Repost ||
      type === NotificationType.RepostOfRepost ||
      type === NotificationType.Favorite ||
      type === NotificationType.FavoriteOfRepost
    ) {
      notification.userIds
        .slice(0, USER_INITIAL_LOAD_COUNT)
        .forEach((id) => userIds.add(id))
    }
    if (type === NotificationType.RemixCreate) {
      trackIds.add(notification.parentTrackId).add(notification.childTrackId)
    }
    if (type === NotificationType.RemixCosign) {
      trackIds.add(notification.childTrackId)
      userIds.add(notification.parentTrackUserId)
    }
    if (
      type === NotificationType.TrendingTrack ||
      type === NotificationType.TrendingUnderground
    ) {
      trackIds.add(notification.entityId)
    }
    if (type === NotificationType.TrendingPlaylist) {
      collectionIds.add(notification.entityId)
    }
    if (
      type === NotificationType.TipSend ||
      type === NotificationType.TipReceive ||
      type === NotificationType.SupporterRankUp ||
      type === NotificationType.SupportingRankUp ||
      type === NotificationType.Reaction
    ) {
      userIds.add(notification.entityId)
    }
    if (
      type === NotificationType.AddTrackToPlaylist ||
      type === NotificationType.TrackAddedToPurchasedAlbum
    ) {
      trackIds.add(notification.trackId)
      userIds.add(notification.playlistOwnerId)
      collectionIds.add(notification.playlistId)
    }
    if (type === NotificationType.SupporterDethroned) {
      userIds.add(notification.supportedUserId).add(notification.entityId)
    }
    if (type === NotificationType.Tastemaker) {
      userIds.add(notification.userId)
      trackIds.add(notification.entityId)
    }
    if (
      type === NotificationType.USDCPurchaseBuyer ||
      type === NotificationType.USDCPurchaseSeller
    ) {
      notification.userIds.forEach((id) => userIds.add(id))
      if (notification.entityType === Entity.Track) {
        trackIds.add(notification.entityId)
      } else if (notification.entityType === Entity.Album) {
        collectionIds.add(notification.entityId)
      }
    }
    if (
      type === NotificationType.RequestManager ||
      type === NotificationType.ApproveManagerRequest
    ) {
      userIds.add(notification.userId)
    }
    if (
      type === NotificationType.Comment ||
      type === NotificationType.CommentThread ||
      type === NotificationType.CommentMention ||
      type === NotificationType.CommentReaction
    ) {
      if (notification.entityType === Entity.Track) {
        trackIds.add(notification.entityId)
      }
      notification.userIds.forEach((id) => userIds.add(id))
    }
  })

  return { userIds, trackIds, collectionIds }
}

export const getNotificationsQueryKey = ({
  currentUserId,
  pageSize
}: {
  currentUserId: ID | null | undefined
  pageSize: number
}) => [QUERY_KEYS.notifications, currentUserId, { pageSize }]

/**
 * Hook that returns paginated notifications for the current user.
 * Uses infinite query to support "Load More" functionality.
 * Pagination is based on the timestamp and groupId of the last notification.
 */
export const useNotifications = (options?: QueryOptions) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const validTypes = useNotificationValidTypes()
  const pageSize = DEFAULT_LIMIT

  const query = useInfiniteQuery({
    queryKey: getNotificationsQueryKey({
      currentUserId,
      pageSize
    }),
    initialPageParam: null as PageParam,
    queryFn: async ({ pageParam = null }) => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.notifications.getNotifications({
        userId: Id.parse(currentUserId),
        limit: DEFAULT_LIMIT,
        timestamp: (pageParam as PageParam)?.timestamp,
        groupId: (pageParam as PageParam)?.groupId,
        validTypes
      })

      return transformAndCleanList(data?.notifications, notificationFromSDK)
    },
    getNextPageParam: (lastPage: Notification[]) => {
      const lastNotification = lastPage[lastPage.length - 1]
      if (!lastNotification || lastPage.length < DEFAULT_LIMIT) {
        return null
      }
      return {
        timestamp: lastNotification.timestamp,
        groupId: lastNotification.groupId
      }
    },
    ...options,
    enabled: options?.enabled !== false && !!currentUserId
  })

  const lastPage = query.data?.pages[query.data.pages.length - 1]
  const { userIds, trackIds, collectionIds } = lastPage
    ? collectEntityIds(lastPage)
    : {
        userIds: new Set<ID>(),
        trackIds: new Set<ID>(),
        collectionIds: new Set<ID>()
      }

  // Pre-fetch related entities
  const usersQuery = useUsers(Array.from(userIds))
  const tracksQuery = useTracks(Array.from(trackIds))
  const collectionsQuery = useCollections(Array.from(collectionIds))

  // Check if the latest page's entity data is still loading
  const isLatestPagePending =
    usersQuery.isPending || tracksQuery.isPending || collectionsQuery.isPending

  const isLatestPageLoading =
    usersQuery.isLoading || tracksQuery.isLoading || collectionsQuery.isLoading

  const isError =
    query.isError ||
    usersQuery.isError ||
    tracksQuery.isError ||
    collectionsQuery.isError

  // Return all pages except the last one if it's still loading entity data
  const notifications = query.data?.pages.slice(0, -1).flat() ?? []
  if (!isLatestPagePending && lastPage) {
    notifications.push(...lastPage)
  }

  return {
    ...query,
    isPending: query.isPending || isLatestPagePending,
    isLoading: query.isLoading || isLatestPageLoading,
    isError,
    notifications
  }
}
