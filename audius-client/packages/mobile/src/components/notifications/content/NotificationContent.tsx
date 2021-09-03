import React from 'react'
import {
  Notification,
  NotificationType
} from '../../../store/notifications/types'
import Favorite from './Favorite'
import Repost from './Repost'
import Follow from './Follow'
import Trending from './Trending'
import Milestone from './Milestone'
import Announcement from './Announcement'
import Remix from './Remix'
import Subscription from './Subscription'
import Cosign from './Cosign'
import ChallengeReward from './ChallengeReward'

type NotificationContentProps = {
  notification: Notification
  onGoToRoute: (route: string) => void
}

const NotificationContent = ({
  notification,
  onGoToRoute
}: NotificationContentProps) => {
  switch (notification.type) {
    case NotificationType.Announcement:
      return <Announcement notification={notification} />
    case NotificationType.Follow:
      return <Follow notification={notification} onGoToRoute={onGoToRoute} />
    case NotificationType.UserSubscription:
      return (
        <Subscription notification={notification} onGoToRoute={onGoToRoute} />
      )
    case NotificationType.Favorite:
      return <Favorite notification={notification} onGoToRoute={onGoToRoute} />
    case NotificationType.Repost:
      return <Repost notification={notification} onGoToRoute={onGoToRoute} />
    case NotificationType.Milestone:
      return <Milestone notification={notification} onGoToRoute={onGoToRoute} />
    case NotificationType.RemixCosign:
      return <Cosign notification={notification} onGoToRoute={onGoToRoute} />
    case NotificationType.RemixCreate:
      return <Remix notification={notification} onGoToRoute={onGoToRoute} />
    case NotificationType.TrendingTrack:
      return <Trending notification={notification} onGoToRoute={onGoToRoute} />
    case NotificationType.ChallengeReward:
      return (
        <ChallengeReward
          notification={notification}
          onGoToRoute={onGoToRoute}
        />
      )
  }
}

export default NotificationContent
