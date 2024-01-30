import { useCallback } from 'react'

import type {
  CollectionEntity,
  Nullable,
  TrendingPlaylistNotification as TrendingPlaylistNotificationType
} from '@audius/common'
import { notificationsSelectors } from '@audius/common'
import { Name } from '@audius/common/models'
import { useSelector } from 'react-redux'

import IconTrending from 'app/assets/images/iconTrending.svg'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  NotificationTwitterButton
} from '../Notification'
const { getNotificationEntity } = notificationsSelectors

const messages = {
  title: "You're Trending",
  is: 'is the',
  trending: 'trending playlist on Audius right now!',
  twitterShareText: (entityTitle: string) =>
    `My playlist ${entityTitle} is trending on @audius! Check it out! #Audius #AudiusTrending `
}

type TrendingPlaylistNotificationProps = {
  notification: TrendingPlaylistNotificationType
}

export const TrendingPlaylistNotification = (
  props: TrendingPlaylistNotificationProps
) => {
  const { notification } = props
  const { rank } = notification
  const playlist = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<CollectionEntity>
  const navigation = useNotificationNavigation()

  const handlePress = useCallback(() => {
    if (playlist) {
      navigation.navigate(notification)
    }
  }, [navigation, notification, playlist])

  if (!playlist) return null

  const shareText = messages.twitterShareText(playlist.playlist_name)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrending}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <EntityLink entity={playlist} /> {messages.is} #{rank}{' '}
        {messages.trending}
      </NotificationText>
      <NotificationTwitterButton
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
