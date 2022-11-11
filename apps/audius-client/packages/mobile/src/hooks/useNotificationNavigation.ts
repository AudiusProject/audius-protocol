import { useCallback, useMemo } from 'react'

import type {
  AddTrackToPlaylistNotification,
  AddTrackToPlaylistPushNotification,
  AnnouncementNotification,
  ChallengeRewardNotification,
  FavoriteNotification,
  FavoritePushNotification,
  FollowNotification,
  FollowPushNotification,
  MilestoneFavoritePushNotification,
  MilestoneFollowPushNotification,
  MilestoneListenPushNotification,
  MilestoneNotification,
  MilestoneRepostPushNotification,
  ReactionNotification,
  ReactionPushNotification,
  RemixCosignNotification,
  RemixCosignPushNotification,
  RemixCreateNotification,
  RemixCreatePushNotification,
  RepostNotification,
  RepostPushNotification,
  SupporterDethronedNotification,
  SupporterRankUpNotification,
  SupporterRankUpPushNotification,
  SupportingRankUpNotification,
  SupportingRankUpPushNotification,
  TierChangeNotification,
  TipReceiveNotification,
  TipReceivePushNotification,
  TipSendNotification,
  TipSendPushNotification,
  TrendingTrackNotification,
  UserSubscriptionNotification
} from '@audius/common'
import {
  notificationsUserListActions,
  tippingActions,
  Achievement,
  Entity,
  NotificationType,
  PushNotificationType
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
        | FollowPushNotification
        | RepostNotification
        | RepostPushNotification
        | FavoriteNotification
        | FavoritePushNotification
    ) => {
      if ('userIds' in notification) {
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
          navigation.navigate('Profile', { id: firstUserId })
        }
      } else {
        // TODO: Need to handle the payload from identity when there are multiple users
        navigation.navigate('Profile', { id: notification.initiator })
      }
    },
    [dispatch, navigation]
  )

  const milestoneHandler = useCallback(
    (
      notification:
        | MilestoneNotification
        | MilestoneFollowPushNotification
        | MilestoneListenPushNotification
        | MilestoneFavoritePushNotification
        | MilestoneRepostPushNotification
    ) => {
      if (notification.type === NotificationType.Milestone) {
        if (notification.achievement === Achievement.Followers) {
          navigation.navigate('Profile', { id: notification.entityId })
        } else {
          navigation.navigate(
            notification.entityType === Entity.Track ? 'Track' : 'Collection',
            { id: notification.entityId }
          )
        }
      } else if (notification.type === PushNotificationType.MilestoneFollow) {
        navigation.navigate('Profile', { id: notification.initiator })
      } else {
        navigation.navigate(
          notification.actions[0].actionEntityType === Entity.Track
            ? 'Track'
            : 'Collection',
          { id: notification.entityId }
        )
      }
    },
    [navigation]
  )

  const profileHandler = useCallback(
    (
      notification:
        | ReactionNotification
        | ReactionPushNotification
        | SupporterRankUpNotification
        | SupporterRankUpPushNotification
        | SupportingRankUpNotification
        | SupportingRankUpPushNotification
        | TipReceiveNotification
        | TipReceivePushNotification
        | TipSendNotification
        | TipSendPushNotification
    ) => {
      navigation.navigate('Profile', {
        id:
          'entityId' in notification
            ? notification.entityId
            : notification.initiator
      })
    },
    [navigation]
  )

  const notificationTypeHandlerMap = useMemo(
    () => ({
      [NotificationType.AddTrackToPlaylist]: (
        notification:
          | AddTrackToPlaylistNotification
          | AddTrackToPlaylistPushNotification
      ) => {
        navigation.navigate('Collection', {
          id:
            'playlistId' in notification
              ? notification.playlistId
              : notification.metadata.playlistId
        })
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
      [PushNotificationType.FavoriteAlbum]: socialActionHandler,
      [PushNotificationType.FavoritePlaylist]: socialActionHandler,
      [PushNotificationType.FavoriteTrack]: socialActionHandler,
      [NotificationType.Favorite]: socialActionHandler,
      [NotificationType.Follow]: socialActionHandler,
      [PushNotificationType.MilestoneFavorite]: milestoneHandler,
      [PushNotificationType.MilestoneFollow]: milestoneHandler,
      [PushNotificationType.MilestoneListen]: milestoneHandler,
      [PushNotificationType.MilestoneRepost]: milestoneHandler,
      [NotificationType.Milestone]: milestoneHandler,
      [NotificationType.Reaction]: profileHandler,
      [NotificationType.RemixCosign]: (
        notification: RemixCosignNotification | RemixCosignPushNotification
      ) => {
        navigation.navigate('Track', {
          id:
            'childTrackId' in notification
              ? notification.childTrackId
              : notification.entityId
        })
      },
      [NotificationType.RemixCreate]: (
        notification: RemixCreateNotification | RemixCreatePushNotification
      ) => {
        navigation.navigate('Track', {
          id:
            'childTrackId' in notification
              ? notification.childTrackId
              : notification.entityId
        })
      },
      [PushNotificationType.RepostAlbum]: socialActionHandler,
      [PushNotificationType.RepostPlaylist]: socialActionHandler,
      [PushNotificationType.RepostTrack]: socialActionHandler,
      [NotificationType.Repost]: socialActionHandler,
      [NotificationType.SupporterDethroned]: (
        notification: SupporterDethronedNotification
      ) => {
        // TODO: Need to handle the payload from identity
        const { supportedUserId } = notification
        const supportedUser = store.getState().users.entries[supportedUserId]

        dispatch(
          beginTip({ user: supportedUser?.metadata, source: 'dethroned' })
        )
        navigation.navigate('TipArtist')
      },
      [NotificationType.SupporterRankUp]: profileHandler,
      [NotificationType.SupportingRankUp]: profileHandler,
      [NotificationType.TierChange]: (notification: TierChangeNotification) => {
        navigation.navigate('AudioScreen')
      },
      [NotificationType.TipReceive]: profileHandler,
      [NotificationType.TipSend]: profileHandler,
      [NotificationType.TrendingTrack]: (
        notification: TrendingTrackNotification
      ) => {
        navigation.navigate('Track', { id: notification.entityId })
      },
      [NotificationType.UserSubscription]: (
        notification: UserSubscriptionNotification
      ) => {
        // TODO: Need to handle the payload from identity
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
    [
      dispatch,
      milestoneHandler,
      navigation,
      profileHandler,
      socialActionHandler,
      store
    ]
  )

  const handleNavigate = useCallback(
    (notification: any) => {
      notificationTypeHandlerMap[notification.type]?.(notification)
    },
    [notificationTypeHandlerMap]
  )

  return useMemo(() => ({ navigate: handleNavigate }), [handleNavigate])
}
