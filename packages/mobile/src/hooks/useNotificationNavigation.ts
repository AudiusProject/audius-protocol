import { useCallback, useMemo } from 'react'

import type {
  AddTrackToPlaylistNotification,
  AnnouncementNotification,
  ChallengeRewardNotification,
  FavoriteNotification,
  FollowNotification,
  MilestoneNotification,
  ReactionNotification,
  RemixCosignNotification,
  RemixCreateNotification,
  RepostNotification,
  SupporterDethronedNotification,
  SupporterRankUpNotification,
  SupportingRankUpNotification,
  TierChangeNotification,
  TipReceiveNotification,
  TipSendNotification,
  TrendingTrackNotification,
  UserSubscriptionNotification
} from '@audius/common'
import {
  notificationsUserListActions,
  tippingActions,
  Achievement,
  Entity,
  NotificationType
} from '@audius/common'
import type { AppState } from 'audius-client/src/store/types'
import { useDispatch, useStore } from 'react-redux'

import { useNavigation } from './useNavigation'

const { setNotificationId } = notificationsUserListActions
const { beginTip } = tippingActions

/**
 * Navigator for notifications
 *
 * Uses the useNavigation hook under the hood
 */
export const useNotificationNavigation = () => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const store = useStore<AppState>()

  const socialActionHandler = useCallback(
    (
      notification:
        | FollowNotification
        | RepostNotification
        | FavoriteNotification
    ) => {
      const { id, type, userIds } = notification
      const firstUserId = userIds[0]
      const isMultiUser = userIds.length > 1

      if (isMultiUser) {
        dispatch(setNotificationId(id))
        navigation.navigate('NotificationUsers', {
          id,
          notificationType: type,
          count: userIds.length
        })
      } else if (firstUserId) {
        navigation.push('Profile', {
          id: firstUserId
        })
      }
    },
    [dispatch, navigation]
  )

  const notificationTypeHandlerMap = useMemo(
    () => ({
      [NotificationType.AddTrackToPlaylist]: (
        notification: AddTrackToPlaylistNotification
      ) => {
        navigation.navigate('Collection', { id: notification.playlistId })
      },
      [NotificationType.Announcement]: (
        notification: AnnouncementNotification
      ) => {
        navigation.navigate('Feed')
      },
      [NotificationType.ChallengeReward]: (
        notification: ChallengeRewardNotification
      ) => {
        navigation.navigate('AudioScreen')
      },
      [NotificationType.Favorite]: (notification: FavoriteNotification) => {
        socialActionHandler(notification)
      },
      [NotificationType.Follow]: (notification: FollowNotification) => {
        socialActionHandler(notification)
      },
      [NotificationType.Milestone]: (notification: MilestoneNotification) => {
        if (notification.achievement === Achievement.Followers) {
          navigation.navigate('Profile', { id: notification.entityId })
        } else {
          navigation.navigate(
            notification.entityType === Entity.Track ? 'Track' : 'Collection',
            { id: notification.entityId }
          )
        }
      },
      [NotificationType.Reaction]: (notification: ReactionNotification) => {
        navigation.navigate('Profile', { id: notification.entityId })
      },
      [NotificationType.RemixCosign]: (
        notification: RemixCosignNotification
      ) => {
        navigation.navigate('Track', {
          // @ts-ignore - Identity notification used entityId
          id: notification.childTrackId ?? notification.entityId
        })
      },
      [NotificationType.RemixCreate]: (
        notification: RemixCreateNotification
      ) => {
        navigation.navigate('Track', {
          // @ts-ignore - Identity notification used entityId
          id: notification.childTrackId ?? notification.entityId
        })
      },
      [NotificationType.Repost]: (notification: RepostNotification) => {
        socialActionHandler(notification)
      },
      [NotificationType.SupporterDethroned]: (
        notification: SupporterDethronedNotification
      ) => {
        const { supportedUserId } = notification
        const supportedUser = store.getState().users.entries[supportedUserId]

        dispatch(
          beginTip({ user: supportedUser?.metadata, source: 'dethroned' })
        )
        navigation.navigate('TipArtist')
      },
      [NotificationType.SupporterRankUp]: (
        notification: SupporterRankUpNotification
      ) => {
        navigation.navigate('Profile', { id: notification.entityId })
      },
      [NotificationType.SupportingRankUp]: (
        notification: SupportingRankUpNotification
      ) => {
        navigation.navigate('Profile', { id: notification.entityId })
      },
      [NotificationType.TierChange]: (notification: TierChangeNotification) => {
        navigation.navigate('AudioScreen')
      },
      [NotificationType.TipReceive]: (notification: TipReceiveNotification) => {
        navigation.navigate('Profile', { id: notification.entityId })
      },
      [NotificationType.TipSend]: (notification: TipSendNotification) => {
        navigation.navigate('Profile', { id: notification.entityId })
      },
      [NotificationType.TrendingTrack]: (
        notification: TrendingTrackNotification
      ) => {
        navigation.navigate('Track', { id: notification.entityId })
      },
      [NotificationType.UserSubscription]: (
        notification: UserSubscriptionNotification
      ) => {
        const multiUpload = notification.entityIds.length > 1

        if (notification.entityType === Entity.Track && multiUpload) {
          navigation.navigate('Profile', { id: notification.userId })
        } else {
          navigation.navigate(
            notification.entityType === Entity.Track ? 'Track' : 'Collection',
            { id: notification.entityIds[0] }
          )
        }
      }
    }),
    [dispatch, navigation, socialActionHandler, store]
  )

  const handleNavigate = useCallback(
    (notification: any) => {
      notificationTypeHandlerMap[notification.type]?.(notification)
    },
    [notificationTypeHandlerMap]
  )

  return useMemo(() => ({ navigate: handleNavigate }), [handleNavigate])
}
