import React from 'react'

import { Notification, NotificationType } from 'app/store/notifications/types'

import Announcement from './Announcement'
import ChallengeReward from './ChallengeReward'
import Cosign from './Cosign'
import Favorite from './Favorite'
import Follow from './Follow'
import Milestone from './Milestone'
import Remix from './Remix'
import Repost from './Repost'
import Subscription from './Subscription'
import TierChange from './TierChange'
import Trending from './Trending'

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
    case NotificationType.TierChange:
      return (
        <TierChange notification={notification} onGoToRoute={onGoToRoute} />
      )
  }
}

export default NotificationContent
