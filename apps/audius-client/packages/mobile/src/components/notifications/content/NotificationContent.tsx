import {
  Notification,
  NotificationType
} from 'audius-client/src/common/store/notifications/types'

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
}

const NotificationContent = ({ notification }: NotificationContentProps) => {
  switch (notification.type) {
    case NotificationType.Announcement:
      return <Announcement notification={notification} />
    case NotificationType.Follow:
      return <Follow notification={notification} />
    case NotificationType.UserSubscription:
      return <Subscription notification={notification} />
    case NotificationType.Favorite:
      return <Favorite notification={notification} />
    case NotificationType.Repost:
      return <Repost notification={notification} />
    case NotificationType.Milestone:
      return <Milestone notification={notification} />
    case NotificationType.RemixCosign:
      return <Cosign notification={notification} />
    case NotificationType.RemixCreate:
      return <Remix notification={notification} />
    case NotificationType.TrendingTrack:
      return <Trending notification={notification} />
    case NotificationType.ChallengeReward:
      return <ChallengeReward notification={notification} />
    case NotificationType.TierChange:
      return <TierChange notification={notification} />
  }
}

export default NotificationContent
