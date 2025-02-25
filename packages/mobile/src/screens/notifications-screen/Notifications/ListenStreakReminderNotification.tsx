import { useCallback } from 'react'

import { listenStreakReminderMessages as messages } from '@audius/common/messages'
import { ChallengeName, Name } from '@audius/common/models'
import type { ListenStreakReminderNotification as ListenStreakReminderNotificationType } from '@audius/common/store'
import { audioRewardsPageActions, modalsActions } from '@audius/common/store'
import { make, useRecord } from 'common/store/analytics/actions'
import { Text } from 'react-native'
import { useDispatch } from 'react-redux'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle
} from '../Notification'

const { setChallengeRewardsModalType } = audioRewardsPageActions
const { setVisibility } = modalsActions

export const IconStreakFire = () => {
  return <Text style={{ fontSize: 32 }}>🔥</Text>
}

type ListenStreakReminderNotificationProps = {
  notification: ListenStreakReminderNotificationType
}

export const ListenStreakReminderNotification = (
  props: ListenStreakReminderNotificationProps
) => {
  const { notification } = props
  const { type } = notification
  const dispatch = useDispatch()
  const record = useRecord()

  const handlePress = useCallback(() => {
    dispatch(
      setChallengeRewardsModalType({
        modalType: ChallengeName.ListenStreakEndless
      })
    )
    dispatch(setVisibility({ modal: 'ChallengeRewards', visible: true }))
    record(make(Name.NOTIFICATIONS_CLICK_TILE, { kind: type, link_to: '' }))
  }, [dispatch, record, type])

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconStreakFire}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.body(notification.streak)}</NotificationText>
    </NotificationTile>
  )
}
