import { useCallback } from 'react'

import { notificationsSelectors } from '@audius/common'
import type { FollowNotification as FollowNotificationType } from '@audius/common'
import { useProxySelector } from '@audius/common/hooks'
import { notificationsSelectors } from '@audius/common/store'
import { formatCount } from '@audius/common/utils'

import IconUser from 'app/assets/images/iconUser.svg'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationTile,
  ProfilePictureList,
  UserNameLink,
  USER_LENGTH_LIMIT,
  NotificationText
} from '../Notification'

const { getNotificationUsers } = notificationsSelectors

const messages = {
  others: (userCount: number) =>
    ` and ${formatCount(userCount)} other${userCount > 1 ? 's' : ''}`,
  followed: ' followed you'
}

type FollowNotificationProps = {
  notification: FollowNotificationType
}

export const FollowNotification = (props: FollowNotificationProps) => {
  const { notification } = props
  const { userIds } = notification
  const navigation = useNotificationNavigation()

  const users = useProxySelector(
    (state) => getNotificationUsers(state, notification, USER_LENGTH_LIMIT),
    [notification]
  )
  const firstUser = users?.[0]
  const otherUsersCount = userIds.length - 1

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

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
