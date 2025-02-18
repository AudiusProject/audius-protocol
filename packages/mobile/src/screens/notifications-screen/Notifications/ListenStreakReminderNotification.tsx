import { useCallback } from 'react'

import { listenStreakReminderMessages as messages } from '@audius/common/messages'
import type { ListenStreakReminderNotification as ListenStreakReminderNotificationType } from '@audius/common/store'
import { Text } from 'react-native'

import { useNavigation } from 'app/hooks/useNavigation'

import {
  NotificationTile,
  NotificationHeader,
  NotificationText,
  NotificationTitle
} from '../Notification'

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
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate('AudioScreen')
  }, [navigation])

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconStreakFire}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.body(notification.streak)}</NotificationText>
    </NotificationTile>
  )
}
