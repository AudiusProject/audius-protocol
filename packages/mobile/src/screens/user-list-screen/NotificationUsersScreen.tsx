import { useCallback } from 'react'

import { NotificationType } from 'audius-client/src/common/store/notifications/types'
import { setNotificationId } from 'audius-client/src/common/store/user-list/notifications/actions'
import { getUserList } from 'audius-client/src/common/store/user-list/notifications/selectors'

import { Screen } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRoute } from 'app/hooks/useRoute'
import { formatCount } from 'app/utils/format'

import { UserList } from './UserList'

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
    <Screen title={getTitle()} variant='secondary'>
      <UserList
        userSelector={getUserList}
        tag='NOTIFICATION_USERS_SCREEN'
        setUserList={handleSetNotificationId}
      />
    </Screen>
  )
}
