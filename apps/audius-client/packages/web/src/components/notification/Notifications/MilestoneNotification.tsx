import React from 'react'

import { Achievement, Milestone } from 'common/store/notifications/types'
import { formatCount } from 'common/utils/formatUtil'

import { EntityLink } from './EntityLink'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { NotificationTitle } from './NotificationTitle'
import { TwitterShareButton } from './TwitterShareButton'
import { IconMilestone } from './icons'

const messages = {
  title: 'Milestone Reached!',
  follows: 'You have reached over',
  your: 'Your',
  reached: 'has reached over'
}

type MilestoneNotificationProps = {
  notification: Milestone
}

export const MilestoneNotification = (props: MilestoneNotificationProps) => {
  const { notification } = props
  const { timeLabel, isRead } = notification

  const renderBody = () => {
    if (notification.achievement === Achievement.Followers) {
      const { achievement, value } = notification
      return `${messages.follows} ${formatCount(value)} ${achievement}`
    } else {
      const { entity, entityType, achievement, value, user } = notification
      const entityWithUser = { ...entity, user }
      const achievementText =
        achievement === Achievement.Listens ? 'Plays' : achievement

      return (
        <span>
          {messages.your} {entityType}
          <EntityLink entity={entityWithUser} entityType={entityType} />{' '}
          {messages.reached} {formatCount(value)} {achievementText}
        </span>
      )
    }
  }

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconMilestone />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>{renderBody()}</NotificationBody>
      <TwitterShareButton />
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
