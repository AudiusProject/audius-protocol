import {
  Notification,
  NotificationType
} from 'audius-client/src/common/store/notifications/types'

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
  TrendingTrackNotification
} from './Notifications'

type NotificationListItemProps = {
  notification: Notification
}
export const NotificationListItem = (props: NotificationListItemProps) => {
  const { notification } = props

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
      case NotificationType.TrendingTrack:
        return <TrendingTrackNotification notification={notification} />
      case NotificationType.UserSubscription:
        return <UserSubscriptionNotification notification={notification} />
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
