import { useCallback } from 'react'

import { notificationsSelectors } from '@audius/common'
import type { UserSubscriptionNotification as UserSubscriptionNotificationType } from '@audius/common'
import { useProxySelector } from '@audius/common/hooks'
import { notificationsSelectors } from '@audius/common/store'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import IconStars from 'app/assets/images/iconStars.svg'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  ProfilePicture
} from '../Notification'
const { getNotificationEntities, getNotificationUser } = notificationsSelectors

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
  const { entityType } = notification
  const navigation = useNotificationNavigation()
  const user = useSelector((state) => getNotificationUser(state, notification))
  const entities = useProxySelector(
    (state) => getNotificationEntities(state, notification),
    [notification]
  )

  const uploadCount = entities?.length ?? 0
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
        <ProfilePicture profile={user} />
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
