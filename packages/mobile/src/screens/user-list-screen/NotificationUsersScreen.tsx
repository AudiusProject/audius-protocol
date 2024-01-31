import {
  NotificationType,
  notificationsUserListActions,
  notificationsUserListSelectors
} from '@audius/common/store'
import { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import { useRoute } from 'app/hooks/useRoute'
import { formatCount } from 'app/utils/format'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'
const { getUserList } = notificationsUserListSelectors
const { setNotificationId } = notificationsUserListActions

export const NotificationUsersScreen = () => {
  const { params } = useRoute<'NotificationUsers'>()
  const { notificationType, count, id } = params
  const dispatch = useDispatch()

  const handleSetNotificationId = useCallback(() => {
    dispatch(setNotificationId(id))
  }, [dispatch, id])

  const getTitle = useCallback(() => {
    if (notificationType === NotificationType.Follow) {
      return `${formatCount(count)} New Followers`
    }
    return `${formatCount(count)} ${notificationType}s`
  }, [notificationType, count])

  return (
    <UserListScreen title={getTitle()}>
      <UserList
        userSelector={getUserList}
        tag='NOTIFICATION'
        setUserList={handleSetNotificationId}
      />
    </UserListScreen>
  )
}
