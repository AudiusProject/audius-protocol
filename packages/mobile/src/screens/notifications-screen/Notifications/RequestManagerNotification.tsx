import { useCallback } from 'react'

import type { RequestManagerNotification as RequestManagerNotificationType } from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

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

const { getNotificationUser } = notificationsSelectors

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

  const user = useSelector((state) => getNotificationUser(state, notification))

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
