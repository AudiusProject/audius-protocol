import { useUsers } from '@audius/common/api'
import { NotificationType } from '@audius/common/store'
import type { Notification } from '@audius/common/store'
import { formatCount } from '@audius/common/utils'

import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

export const getTitle = (notification: Notification) => {
  if (!('userIds' in notification)) return 'Users'
  const count = notification.userIds.length
  if (notification.type === NotificationType.Follow)
    return `${formatCount(count)} New Followers`
  if (
    notification.type === NotificationType.Comment ||
    notification.type === NotificationType.CommentThread ||
    notification.type === NotificationType.CommentMention ||
    notification.type === NotificationType.CommentReaction
  )
    return `${formatCount(count)} Commenters`
  return `${formatCount(count)} ${notification.type.toLowerCase()}s`
}

export const NotificationUsersScreen = () => {
  const { params } = useRoute<'NotificationUsers'>()
  const { notification } = params
  const { userIds } = notification
  const { data, isPending } = useUsers(userIds)

  return (
    <UserListScreen title={getTitle(notification)}>
      <UserList
        data={data}
        count={userIds?.length}
        isPending={isPending}
        tag='NOTIFICATION'
        isFetchingNextPage={false}
      />
    </UserListScreen>
  )
}
