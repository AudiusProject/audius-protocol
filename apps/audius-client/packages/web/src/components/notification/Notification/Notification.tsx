import React from 'react'

import { useSelector } from 'react-redux'

import { CommonState } from 'common/store'
import {
  getNotificationEntities,
  getNotificationEntity,
  getNotificationUser,
  getNotificationUsers
} from 'common/store/notifications/selectors'
import {
  Notification as Notifications,
  NotificationType
} from 'common/store/notifications/types'

import { AnnouncementNotification } from './AnnouncementNotification'
import { ChallengeRewardNotification } from './ChallengeRewardNotification'
import { FavoriteNotification } from './FavoriteNotification'
import { FollowNotification } from './FollowNotification'
import { MilestoneNotification } from './MilestoneNotification'
import { RemixCosignNotification } from './RemixCosignNotification'
import { RemixCreateNotification } from './RemixCreateNotification'
import { RepostNotification } from './RepostNotification'
import { TierChangeNotification } from './TierChangeNotification'
import { TipReactionNotification } from './TipReactionNotification'
import { TipReceivedNotification } from './TipReceivedNotification'
import { TipSentNotification } from './TipSentNotification'
import { TopSupporterNotification } from './TopSupporterNotification'
import { TopSupportingNotification } from './TopSupportingNotification'
import { TrendingTrackNotification } from './TrendingTrackNotification'
import { UserSubscriptionNotification } from './UserSubscriptionNotification'
import { USER_LENGTH_LIMIT } from './utils'

type NotificationProps = {
  notification: Notifications
}

export const Notification = (props: NotificationProps) => {
  const { notification: notificationProp } = props
  const user = useSelector((state: CommonState) =>
    getNotificationUser(state, notificationProp)
  )

  const users = useSelector((state: CommonState) =>
    getNotificationUsers(state, notificationProp, USER_LENGTH_LIMIT)
  )

  const entity = useSelector((state: CommonState) =>
    getNotificationEntity(state, notificationProp)
  )

  const entities = useSelector((state: CommonState) =>
    getNotificationEntities(state, notificationProp)
  )

  // Based on how notification types are defined, we need to cast like this.
  // In the future we should select user/users/entity/entities in each notif.
  const notification = ({
    ...notificationProp,
    user,
    users,
    entity,
    entities
  } as unknown) as Notifications

  switch (notification.type) {
    case NotificationType.Announcement: {
      return <AnnouncementNotification notification={notification} />
    }
    case NotificationType.ChallengeReward: {
      return <ChallengeRewardNotification notification={notification} />
    }
    case NotificationType.Favorite: {
      return <FavoriteNotification notification={notification} />
    }
    case NotificationType.Follow: {
      return <FollowNotification notification={notification} />
    }
    case NotificationType.Milestone: {
      return <MilestoneNotification notification={notification} />
    }
    case NotificationType.RemixCosign: {
      return <RemixCosignNotification notification={notification} />
    }
    case NotificationType.RemixCreate: {
      return <RemixCreateNotification notification={notification} />
    }
    case NotificationType.Repost: {
      return <RepostNotification notification={notification} />
    }
    case NotificationType.TierChange: {
      return <TierChangeNotification notification={notification} />
    }
    case NotificationType.TipReaction: {
      return <TipReactionNotification notification={notification} />
    }
    case NotificationType.TipReceived: {
      return <TipReceivedNotification notification={notification} />
    }
    case NotificationType.TipSent: {
      return <TipSentNotification notification={notification} />
    }
    case NotificationType.TopSupporter: {
      return <TopSupporterNotification notification={notification} />
    }
    case NotificationType.TopSupporting: {
      return <TopSupportingNotification notification={notification} />
    }
    case NotificationType.TrendingTrack: {
      return <TrendingTrackNotification notification={notification} />
    }
    case NotificationType.UserSubscription: {
      return <UserSubscriptionNotification notification={notification} />
    }
    default: {
      return null
    }
  }
}
