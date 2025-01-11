import { useNotifications } from '@audius/common/api'
import { notificationUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const NotificationUserList = () => {
  const userId = useSelector(notificationUserListSelectors.getId)
  const query = useNotifications({ userId })

  return <UserListV2 {...query} />
}
