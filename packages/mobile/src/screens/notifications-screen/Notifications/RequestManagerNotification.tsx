import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import type { RequestManagerNotification as RequestManagerNotificationType } from '@audius/common/store'
import { View } from 'react-native'

import { IconUserArrowRotate } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationProfilePicture,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  UserNameLink
} from '../Notification'

const messages = {
  title: 'Account Management Request',
  invitedYouToManage: 'has invited you to manage their account.'
}

type RequestManagerNotificationProps = {
  notification: RequestManagerNotificationType
}

export const RequestManagerNotification = (
  props: RequestManagerNotificationProps
) => {
  const { notification } = props
  const navigation = useNotificationNavigation()

  const { data: user } = useUser(notification.userId)

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!user) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconUserArrowRotate}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <NotificationProfilePicture profile={user} />
        <NotificationText style={{ flexShrink: 1 }}>
          <UserNameLink user={user} /> {messages.invitedYouToManage}
        </NotificationText>
      </View>
    </NotificationTile>
  )
}
