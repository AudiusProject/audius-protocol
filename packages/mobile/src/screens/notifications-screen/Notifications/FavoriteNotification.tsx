import type { FavoriteNotification as FavoriteNotificationType } from '@audius/common'
import { formatCount, notificationsSelectors } from '@audius/common'

import IconHeart from 'app/assets/images/iconHeart.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

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
  favorited: ' favorited your'
}

type FavoriteNotificationProps = {
  notification: FavoriteNotificationType
}

export const FavoriteNotification = (props: FavoriteNotificationProps) => {
  const { notification } = props
  const { userIds, entityType } = notification
  const users = useSelectorWeb(
    (state) => getNotificationUsers(state, notification, USER_LENGTH_LIMIT),
    isEqual
  )
  const firstUser = users?.[0]
  const otherUsersCount = userIds.length - 1

  const entity = useSelectorWeb(
    (state) => getNotificationEntity(state, notification),
    isEqual
  )

  const handlePress = useSocialActionHandler(notification, users)

  if (!users || !firstUser || !entity) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconHeart}>
        <ProfilePictureList users={users} />
      </NotificationHeader>
      <NotificationText>
        <UserNameLink user={firstUser} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.favorited} {entityType.toLowerCase()}{' '}
        <EntityLink entity={entity} />
      </NotificationText>
    </NotificationTile>
  )
}
