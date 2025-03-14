import { useUsers } from '@audius/common/api'
import { notificationsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

const { getNotification } = notificationsUserListSelectors

export const NotificationsUserList = () => {
  const notification = useSelector(getNotification)
  const userIds = notification?.userIds
  const { data, isPending } = useUsers(userIds)

  return (
    <UserListV2
      data={data}
      isPending={isPending}
      hasNextPage={false}
      isFetchingNextPage={false}
    />
  )
}
