import { useCallback } from 'react'

import { useProxySelector } from '@audius/common/hooks'
import type { CommentNotification as CommentNotificationType } from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import { formatCount } from '@audius/common/utils'

import { IconMessage } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationTile,
  ProfilePictureList,
  UserNameLink,
  USER_LENGTH_LIMIT,
  NotificationText,
  EntityLink
} from '../Notification'

const { getNotificationEntity, getNotificationUsers } = notificationsSelectors

const messages = {
  others: (userCount: number) =>
    ` and ${formatCount(userCount)} other${userCount > 1 ? 's' : ''}`,
  commented: ' commented on your'
}

type CommentNotificationProps = {
  notification: CommentNotificationType
}

export const CommentNotification = (props: CommentNotificationProps) => {
  const { notification } = props
  const { userIds, entityType } = notification
  const navigation = useNotificationNavigation()

  const users = useProxySelector(
    (state) => getNotificationUsers(state, notification, USER_LENGTH_LIMIT),
    [notification]
  )

  const firstUser = users?.[0]
  const otherUsersCount = userIds.length - 1

  const entity = useProxySelector(
    (state) => getNotificationEntity(state, notification),
    [notification]
  )

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!users || !firstUser || !entity) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconMessage}>
        <ProfilePictureList users={users} />
      </NotificationHeader>
      <NotificationText>
        <UserNameLink user={firstUser} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.commented} {entityType.toLowerCase()}{' '}
        <EntityLink entity={entity} />
      </NotificationText>
    </NotificationTile>
  )
}
