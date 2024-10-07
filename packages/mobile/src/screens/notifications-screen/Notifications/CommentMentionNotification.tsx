import { useCallback } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import { useProxySelector } from '@audius/common/hooks'
import type { CommentMentionNotification as CommentMentionNotificationType } from '@audius/common/store'
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
  mentioned: ' tagged you in a comment on',
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
        {otherUsersCount > 0 ? messages.others(otherUsersCount) : null}
        {messages.mentioned}{' '}
        {isOwner ? messages.your : <UserNameLink user={entity.user} isOwner />}{' '}
        {entityType.toLowerCase()} <EntityLink entity={entity} />
      </NotificationText>
    </NotificationTile>
  )
}
