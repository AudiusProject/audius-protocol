import { notificationsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

const { getNotification } = notificationsUserListSelectors

export const NotificationsUserList = () => {
  const notification = useSelector(getNotification)
  const userIds = notification?.userIds

  return (
    <UserList
      data={userIds}
      totalCount={userIds?.length}
      isPending={false}
      hasNextPage={false}
      isFetchingNextPage={false}
    />
  )
}
