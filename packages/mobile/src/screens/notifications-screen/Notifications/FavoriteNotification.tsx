import { useCallback } from 'react'

import { useNotificationEntity } from '@audius/common/api'
import type { FavoriteNotification as FavoriteNotificationType } from '@audius/common/store'
import { notificationsSelectors, Entity } from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import { IconHeart } from '@audius/harmony-native'
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

const { getNotificationUsers } = notificationsSelectors

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
  const navigation = useNotificationNavigation()

  const users = useSelector((state) =>
    getNotificationUsers(state, notification, USER_LENGTH_LIMIT)
  )

  const firstUser = users?.[0]
  const otherUsersCount = userIds.length - 1

  const entity = useNotificationEntity(notification)

  const entityTypeText =
    entity && 'is_album' in entity && entity.is_album
      ? Entity.Album
      : entityType

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!users || !firstUser || !entity) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconHeart}>
        <ProfilePictureList users={users} />
      </NotificationHeader>
      <NotificationText>
        <UserNameLink user={firstUser} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}{' '}
        {messages.favorited} {entityTypeText.toLowerCase()}{' '}
        <EntityLink entity={entity} />
      </NotificationText>
    </NotificationTile>
  )
}
