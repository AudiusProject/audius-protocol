import type { Notification } from 'audius-client/src/common/store/notifications/types'
import { NotificationType } from 'audius-client/src/common/store/notifications/types'

import { NotificationErrorBoundary } from './NotificationErrorBoundary'
import {
  FavoriteNotification,
  FollowNotification,
  RepostNotification,
  ChallengeRewardNotification,
  RemixCreateNotification,
  UserSubscriptionNotification,
  RemixCosignNotification,
  MilestoneNotification,
  AnnouncementNotification,
  TierChangeNotification,
  TrendingTrackNotification,
  TopSupporterNotification,
  TopSupportingNotification,
  TipReactionNotification,
  TipSentNotification,
  TipReceivedNotification,
  AddTrackToPlaylistNotification,
  SupporterDethronedNotification
} from './Notifications'

type NotificationListItemProps = {
  notification: Notification
  isVisible: boolean
}
export const NotificationListItem = (props: NotificationListItemProps) => {
  const { notification, isVisible } = props

  const renderNotification = () => {
    switch (notification.type) {
      case NotificationType.Announcement:
        return <AnnouncementNotification notification={notification} />
      case NotificationType.ChallengeReward:
        return <ChallengeRewardNotification notification={notification} />
      case NotificationType.Favorite:
        return <FavoriteNotification notification={notification} />
      case NotificationType.Follow:
        return <FollowNotification notification={notification} />
      case NotificationType.Milestone:
        return <MilestoneNotification notification={notification} />
      case NotificationType.RemixCosign:
        return <RemixCosignNotification notification={notification} />
      case NotificationType.RemixCreate:
        return <RemixCreateNotification notification={notification} />
      case NotificationType.Repost:
        return <RepostNotification notification={notification} />
      case NotificationType.TierChange:
        return <TierChangeNotification notification={notification} />
      case NotificationType.Reaction:
        return (
          <TipReactionNotification
            notification={notification}
            isVisible={isVisible}
          />
        )
      case NotificationType.TipReceive:
        return (
          <TipReceivedNotification
            notification={notification}
            isVisible={props.isVisible}
          />
        )
      case NotificationType.TipSend:
        return <TipSentNotification notification={notification} />
      case NotificationType.SupporterRankUp:
        return <TopSupporterNotification notification={notification} />
      case NotificationType.SupportingRankUp:
        return <TopSupportingNotification notification={notification} />
      case NotificationType.TrendingTrack:
        return <TrendingTrackNotification notification={notification} />
      case NotificationType.UserSubscription:
        return <UserSubscriptionNotification notification={notification} />
      case NotificationType.AddTrackToPlaylist:
        return <AddTrackToPlaylistNotification notification={notification} />
      case NotificationType.SupporterDethroned:
        return <SupporterDethronedNotification notification={notification} />
      default:
        return null
    }
  }

  return (
    <NotificationErrorBoundary>
      {renderNotification()}
    </NotificationErrorBoundary>
  )
}
