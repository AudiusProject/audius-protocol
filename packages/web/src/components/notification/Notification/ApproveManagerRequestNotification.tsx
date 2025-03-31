import { useCallback } from 'react'

import {
  ApproveManagerRequestNotification as ApproveManagerNotificationType,
  notificationsSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconUserArrowRotate } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { push } from 'utils/navigation'
import { useSelector } from 'utils/reducer'

import { NotificationBody } from './components/NotificationBody'
import { NotificationFooter } from './components/NotificationFooter'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { UserNameLink } from './components/UserNameLink'

const { profilePage } = route
const { getNotificationUser } = notificationsSelectors

const messages = {
  title: 'New Account Manager Added',
  addedAsManager: 'has been added as a manager on your account. '
}

type ApproveManagerNotificationProps = {
  notification: ApproveManagerNotificationType
}

export const ApproveManagerNotification = (
  props: ApproveManagerNotificationProps
) => {
  const { notification } = props
  const { timeLabel, isViewed } = notification
  const dispatch = useDispatch()
  const managerUser = useSelector((state) =>
    getNotificationUser(state, notification)
  )

  const handleClick = useCallback(() => {
    if (managerUser?.handle) {
      dispatch(push(profilePage(managerUser.handle)))
    }
  }, [dispatch, managerUser?.handle])

  if (!managerUser) return null
  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader
        icon={<IconUserArrowRotate color='accent' size='2xl' />}
      >
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>
        <UserNameLink user={managerUser} notification={notification} />{' '}
        {messages.addedAsManager}
      </NotificationBody>
      <NotificationFooter timeLabel={timeLabel} isViewed={isViewed} />
    </NotificationTile>
  )
}
