import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import { ListenStreakNotification as ListenStreakNotificationType } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import { push } from 'utils/navigation'

import { NotificationBody } from './components/NotificationBody'
import { NotificationHeader } from './components/NotificationHeader'
import { NotificationTile } from './components/NotificationTile'
import { NotificationTitle } from './components/NotificationTitle'
import { IconStreakFire } from './components/icons'

const { REWARDS_PAGE } = route

const messages = {
  title: 'Keep Your Streak Going!',
  body: (streak: number) =>
    `Your ${streak} day listening streak will end in 6 hours! Keep listening to earn daily rewards!`
}

type ListenStreakNotificationProps = {
  notification: ListenStreakNotificationType
}

export const ListenStreakNotification = (
  props: ListenStreakNotificationProps
) => {
  const { notification } = props
  const record = useRecord()
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(push(REWARDS_PAGE))
    record(
      make(Name.NOTIFICATIONS_CLICK_TILE, {
        kind: notification.type,
        link_to: REWARDS_PAGE
      })
    )
  }, [dispatch, notification, record])

  return (
    <NotificationTile notification={notification} onClick={handleClick}>
      <NotificationHeader icon={<IconStreakFire size='l' />}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationBody>{messages.body(notification.streak)}</NotificationBody>
    </NotificationTile>
  )
}
