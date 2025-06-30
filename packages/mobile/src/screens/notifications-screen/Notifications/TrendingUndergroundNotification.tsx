import { useCallback } from 'react'

import { useNotificationEntity } from '@audius/common/api'
import { Name } from '@audius/common/models'
import type {
  TrackEntity,
  TrendingUndergroundNotification as TrendingUndergroundNotificationType
} from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'

import { IconTrending } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  NotificationXButton
} from '../Notification'

const messages = {
  title: "You're Trending",
  is: 'is',
  trending: 'on Underground Trending right now!',
  xShareText: (entityTitle: string) =>
    `My track ${entityTitle} made it to the top of underground trending on @audius! Check it out! #Audius #AudiusTrending $AUDIO `
}

type TrendingUndergroundNotificationProps = {
  notification: TrendingUndergroundNotificationType
}

export const TrendingUndergroundNotification = (
  props: TrendingUndergroundNotificationProps
) => {
  const { notification } = props
  const { rank } = notification
  const entity = useNotificationEntity(notification) as Nullable<TrackEntity>
  const navigation = useNotificationNavigation()

  const handlePress = useCallback(() => {
    if (entity) {
      navigation.navigate(notification)
    }
  }, [navigation, notification, entity])

  if (!entity) return null

  const shareText = messages.xShareText(entity.title)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrending}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <EntityLink entity={entity} /> {messages.is} #{rank} {messages.trending}
      </NotificationText>
      <NotificationXButton
        type='static'
        shareText={shareText}
        analytics={{
          eventName:
            Name.NOTIFICATIONS_CLICK_TRENDING_UNDERGROUND_TWITTER_SHARE,
          text: shareText
        }}
      />
    </NotificationTile>
  )
}
