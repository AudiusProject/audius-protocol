import { useCallback } from 'react'

import { useNotificationEntities, useUser } from '@audius/common/api'
import type { UserSubscriptionNotification as UserSubscriptionNotificationType } from '@audius/common/store'
import { View } from 'react-native'

import { IconStars } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  NotificationProfilePicture
} from '../Notification'

const messages = {
  title: 'New Release',
  posted: 'posted',
  new: 'new'
}

type UserSubscriptionNotificationProps = {
  notification: UserSubscriptionNotificationType
}

export const UserSubscriptionNotification = (
  props: UserSubscriptionNotificationProps
) => {
  const { notification } = props
  const { entityType, entityIds } = notification
  const navigation = useNotificationNavigation()
  const { data: user } = useUser(notification.userId)
  const entities = useNotificationEntities(notification)

  const uploadCount = entityIds.length
  const isSingleUpload = uploadCount === 1

  const handlePress = useCallback(() => {
    navigation.navigate(notification)
  }, [navigation, notification])

  if (!user || !entities) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconStars}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <NotificationProfilePicture profile={user} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={user} /> {messages.posted}{' '}
            {isSingleUpload ? 'a' : uploadCount} {messages.new}{' '}
            {entityType.toLowerCase()}
            {isSingleUpload ? '' : 's'}{' '}
            {isSingleUpload ? <EntityLink entity={entities[0]} /> : null}
          </NotificationText>
        </View>
      </View>
    </NotificationTile>
  )
}
