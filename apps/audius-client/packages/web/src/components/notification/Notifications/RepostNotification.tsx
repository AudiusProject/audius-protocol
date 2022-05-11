import React from 'react'

import { Repost } from 'common/store/notifications/types'

import { EntityLink, useGoToEntity } from './EntityLink'
import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { UserNameLink } from './UserNameLink'
import { UserProfileList } from './UserProfileList'
import { IconRepost } from './icons'
import { formatOthersCount } from './utils'

const messages = {
  others: formatOthersCount,
  reposted: ' reposted your '
}

type RepostNotificationProps = {
  notification: Repost
}

export const RepostNotification = (props: RepostNotificationProps) => {
  const { notification } = props
  const { users, entity, entityType, timeLabel, isRead } = notification
  const [firstUser, ...otherUsers] = users
  const otherUsersCount = otherUsers.length

  const handleClick = useGoToEntity(entity, entityType)

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconRepost />}>
        <UserProfileList users={users} />
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={firstUser} notification={notification} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.reposted}
        {entityType.toLowerCase()}
        <EntityLink entity={entity} entityType={entityType} />
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
