import { useCallback } from 'react'

import { listenStreakReminderMessages as messages } from '@audius/common/messages'
import { ChallengeName } from '@audius/common/models'
import type { ListenStreakReminderNotification as ListenStreakReminderNotificationType } from '@audius/common/store'
import { audioRewardsPageActions, modalsActions } from '@audius/common/store'
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
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(
      setChallengeRewardsModalType({
        modalType: ChallengeName.ListenStreakEndless
      })
    )
    dispatch(setVisibility({ modal: 'ChallengeRewards', visible: true }))
  }, [dispatch])

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconStreakFire}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.body(notification.streak)}</NotificationText>
    </NotificationTile>
  )
}
