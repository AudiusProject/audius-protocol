import { getNotificationUsers } from 'audius-client/src/common/store/notifications/selectors'
import type { Follow } from 'common/store/notifications/types'
import { formatCount } from 'common/utils/formatUtil'

import IconUser from 'app/assets/images/iconUser.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import {
  NotificationHeader,
  NotificationTile,
  ProfilePictureList,
  UserNameLink,
  USER_LENGTH_LIMIT,
  NotificationText
} from '../Notification'

import { useSocialActionHandler } from './useSocialActionHandler'

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
  const { userIds } = notification
  const users = useSelectorWeb(
    (state) => getNotificationUsers(state, notification, USER_LENGTH_LIMIT),
    isEqual
  )
  const firstUser = users?.[0]
  const otherUsersCount = userIds.length - 1

  const handlePress = useSocialActionHandler(notification, users)

  if (!users || !firstUser) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconUser}>
        <ProfilePictureList users={users} />
      </NotificationHeader>
      <NotificationText>
        <UserNameLink user={firstUser} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.followed}
      </NotificationText>
    </NotificationTile>
  )
}
