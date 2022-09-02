import type { RepostNotification as RepostNotificationType } from '@audius/common'
import { formatCount, notificationsSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import IconRepost from 'app/assets/images/iconRepost.svg'

import {
  NotificationHeader,
  NotificationTile,
  ProfilePictureList,
  UserNameLink,
  USER_LENGTH_LIMIT,
  NotificationText,
  EntityLink
} from '../Notification'

import { useSocialActionHandler } from './useSocialActionHandler'
const { getNotificationEntity, getNotificationUsers } = notificationsSelectors

const messages = {
  others: (userCount: number) =>
    ` and ${formatCount(userCount)} other${userCount > 1 ? 's' : ''}`,
  reposted: ' reposted your'
}

type RepostNotificationProps = {
  notification: RepostNotificationType
}

export const RepostNotification = (props: RepostNotificationProps) => {
  const { notification } = props
  const { userIds, entityType } = notification
  const users = useSelector((state) =>
    getNotificationUsers(state, notification, USER_LENGTH_LIMIT)
  )
  const firstUser = users?.[0]
  const otherUsersCount = userIds.length - 1

  const entity = useSelector((state) =>
    getNotificationEntity(state, notification)
  )

  const handlePress = useSocialActionHandler(notification, users)

  if (!users || !firstUser || !entity) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconRepost}>
        <ProfilePictureList users={users} />
      </NotificationHeader>
      <NotificationText>
        <UserNameLink user={firstUser} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.reposted} {entityType.toLowerCase()}{' '}
        <EntityLink entity={entity} />
      </NotificationText>
    </NotificationTile>
  )
}
