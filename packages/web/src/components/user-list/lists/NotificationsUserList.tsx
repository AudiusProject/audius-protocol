import { useUsers } from '@audius/common/api'
import { notificationsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

const { getNotification } = notificationsUserListSelectors

export const NotificationsUserList = () => {
  const notification = useSelector(getNotification)
  const userIds = notification?.userIds
  const { data, isPending } = useUsers(userIds)

  return (
    <UserList
      data={data}
      totalCount={userIds?.length}
      isPending={isPending}
      hasNextPage={false}
      isFetchingNextPage={false}
    />
  )
}
