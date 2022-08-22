import { useCallback } from 'react'

import type { UserSubscriptionNotification as UserSubscriptionNotificationType } from '@audius/common'
import { notificationsSelectors, Entity } from '@audius/common'
import { profilePage } from 'audius-client/src/utils/route'
import { View } from 'react-native'

import IconStars from 'app/assets/images/iconStars.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  ProfilePicture
} from '../Notification'
import { getEntityRoute, getEntityScreen } from '../Notification/utils'
import { useDrawerNavigation } from '../useDrawerNavigation'
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
  const navigation = useDrawerNavigation()
  const user = useSelectorWeb((state) =>
    getNotificationUser(state, notification)
  )
  const entities = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  )

  const uploadCount = entities?.length ?? 0
  const isSingleUpload = uploadCount === 1

  const handlePress = useCallback(() => {
    if (entityType === Entity.Track && !isSingleUpload) {
      if (user) {
        navigation.navigate({
          native: {
            screen: 'Profile',
            params: { handle: user.handle, fromNotifications: true }
          },
          web: {
            route: profilePage(user.handle)
          }
        })
      }
    } else {
      if (entities) {
        const [entity] = entities
        navigation.navigate({
          native: getEntityScreen(entity),
          web: { route: getEntityRoute(entity) }
        })
      }
    }
  }, [entityType, isSingleUpload, navigation, user, entities])

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
