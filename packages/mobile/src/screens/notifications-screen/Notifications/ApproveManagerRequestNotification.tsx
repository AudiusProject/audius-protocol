import { useCallback } from 'react'

import type { ApproveManagerRequestNotification as ApproveManagerRequestNotificationType } from '@audius/common/store'
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
  title: 'New Account Manager Added',
  addedAsManager: 'has been added as a manager on your account. '
}

type ApproveManagerRequestNotificationProps = {
  notification: ApproveManagerRequestNotificationType
}

export const ApproveManagerRequestNotification = (
  props: ApproveManagerRequestNotificationProps
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
          <UserNameLink user={user} /> {messages.addedAsManager}
        </NotificationText>
      </View>
    </NotificationTile>
  )
}
