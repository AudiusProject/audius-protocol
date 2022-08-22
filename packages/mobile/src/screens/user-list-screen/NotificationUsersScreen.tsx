import { useCallback } from 'react'

import {
  NotificationType,
  notificationsUserListActions,
  notificationsUserListSelectors
} from '@audius/common'

import { Screen } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'
import { formatCount } from 'app/utils/format'

import { UserList } from './UserList'
const { getUserList } = notificationsUserListSelectors
const { setNotificationId } = notificationsUserListActions

export const NotificationUsersScreen = () => {
  const { params } = useRoute<'NotificationUsers'>()
  const { notificationType, count, id } = params
  const dispatchWeb = useDispatchWeb()

  const handleSetNotificationId = useCallback(() => {
    dispatchWeb(setNotificationId(id))
  }, [dispatchWeb, id])

  const getTitle = useCallback(() => {
    if (notificationType === NotificationType.Follow) {
      return `${formatCount(count)} new followers`
    }
    return `${formatCount(count)} ${notificationType.toLowerCase()}s`
  }, [notificationType, count])

  return (
    <Screen title={getTitle()} variant='white'>
      <UserList
        userSelector={getUserList}
        tag='NOTIFICATION'
        setUserList={handleSetNotificationId}
      />
    </Screen>
  )
}
