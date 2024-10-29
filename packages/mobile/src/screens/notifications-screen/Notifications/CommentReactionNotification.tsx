import { useCallback } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import { useProxySelector } from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import type { CommentReactionNotification as CommentReactionNotificationType } from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import { formatCount } from '@audius/common/utils'

import { IconMessage } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
import { make, track } from 'app/services/analytics'

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
  liked: ' liked your comment on',
  your: 'your',
  their: 'their'
}

type CommentReactionNotificationProps = {
  notification: CommentReactionNotificationType
}

export const CommentReactionNotification = (
  props: CommentReactionNotificationProps
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
  const isOwnerReaction =
    entity?.user?.user_id === firstUser?.user_id && otherUsersCount === 0

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
    track(
      make({
        eventName: Name.COMMENTS_NOTIFICATION_OPEN,
        commentId: notification.entityId,
        notificationType: 'reaction'
      })
    )
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
        {messages.liked}{' '}
        {isOwner ? (
          messages.your
        ) : isOwnerReaction ? (
          messages.their
        ) : (
          <UserNameLink user={entity.user} isOwner />
        )}{' '}
        {entityType.toLowerCase()} <EntityLink entity={entity} />
      </NotificationText>
    </NotificationTile>
  )
}