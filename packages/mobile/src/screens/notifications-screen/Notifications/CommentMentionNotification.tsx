import React, { useCallback } from 'react'

import { useGetCurrentUserId, useNotificationEntity } from '@audius/common/api'
import type { CommentMentionNotification as CommentMentionNotificationType } from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { IconMessage } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  ProfilePictureList,
  UserNameLink
} from '../Notification'

const { getNotificationUsers } = notificationsSelectors

const USER_LENGTH_LIMIT = 3

const messages = {
  others: (count: number) => ` and ${count} other${count > 1 ? 's' : ''}`,
  mentioned: 'mentioned',
  your: 'your'
}

type CommentMentionNotificationProps = {
  notification: CommentMentionNotificationType
}

export const CommentMentionNotification = (
  props: CommentMentionNotificationProps
) => {
  const { notification } = props
  const { userIds, entityType } = notification
  const navigation = useNotificationNavigation()

  const users = useSelector((state) =>
    getNotificationUsers(state, notification, USER_LENGTH_LIMIT)
  )

  const firstUser = users?.[0]
  const otherUsersCount = userIds.length - 1

  const entity = useNotificationEntity(notification)
  const { data: currentUserId } = useGetCurrentUserId({})
  const isOwner = entity?.user?.user_id === currentUserId

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!users || !firstUser || !entity || !entity.user) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconMessage}>
        <ProfilePictureList users={users} />
      </NotificationHeader>
      <NotificationText>
        <UserNameLink user={firstUser} />
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}{' '}
        {messages.mentioned}{' '}
        {isOwner ? messages.your : <UserNameLink user={entity.user} isOwner />}{' '}
        {entityType.toLowerCase()} <EntityLink entity={entity} />
      </NotificationText>
    </NotificationTile>
  )
}
