import React from 'react'

import { ReactComponent as IconUser } from 'assets/img/iconUser.svg'
import { Follow } from 'common/store/notifications/types'
import { formatCount } from 'common/utils/formatUtil'

import { NotificationBody } from './NotificationBody'
import { NotificationFooter } from './NotificationFooter'
import { NotificationHeader } from './NotificationHeader'
import { NotificationTile } from './NotificationTile'
import { UserNameLink } from './UserNameLink'
import { UserProfilePictureList } from './UserProfilePictureList'

const messages = {
  others: (userCount: number) =>
    ` and ${formatCount(userCount)} other${userCount > 1 ? 's' : ''}`,
  followed: ' followed you'
}

type FollowNotificationProps = {
  notification: Follow
}

export const FollowNotification = (props: FollowNotificationProps) => {
  const { notification } = props
  const { users, timeLabel, isRead } = notification
  const [firstUser, ...otherUsers] = users
  const otherUsersCount = otherUsers.length

  return (
    <NotificationTile notification={notification}>
      <NotificationHeader icon={<IconUser />}>
        <UserProfilePictureList users={users} />
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={firstUser} notification={notification} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.followed}
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isRead={isRead} />
    </NotificationTile>
  )
}
