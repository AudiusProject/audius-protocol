import { useCallback } from 'react'

import { useNotificationEntity } from '@audius/common/api'
import { Name } from '@audius/common/models'
import type {
  CollectionEntity,
  TrendingPlaylistNotification as TrendingPlaylistNotificationType
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
  is: 'is the',
  trending: 'trending playlist on Audius right now!',
  xShareText: (entityTitle: string) =>
    `My playlist ${entityTitle} is trending on @audius! Check it out! $AUDIO`
}

type TrendingPlaylistNotificationProps = {
  notification: TrendingPlaylistNotificationType
}

export const TrendingPlaylistNotification = (
  props: TrendingPlaylistNotificationProps
) => {
  const { notification } = props
  const { rank } = notification
  const entity = useNotificationEntity(
    notification
  ) as Nullable<CollectionEntity>
  const navigation = useNotificationNavigation()

  const handlePress = useCallback(() => {
    if (entity) {
      navigation.navigate(notification)
    }
  }, [navigation, notification, entity])

  if (!entity) return null

  const shareText = messages.xShareText(entity.playlist_name)

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
          eventName: Name.NOTIFICATIONS_CLICK_TRENDING_PLAYLIST_TWITTER_SHARE,
          text: shareText
        }}
      />
    </NotificationTile>
  )
}
