import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import type {
  TrackEntity,
  TrendingUndergroundNotification as TrendingUndergroundNotificationType
} from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
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
  is: 'is',
  trending: 'on Underground Trending right now!',
  twitterShareText: (entityTitle: string) =>
    `My track ${entityTitle} made it to the top of underground trending on @audius! Check it out! #Audius #AudiusTrending `
}

type TrendingUndergroundNotificationProps = {
  notification: TrendingUndergroundNotificationType
}

export const TrendingUndergroundNotification = (
  props: TrendingUndergroundNotificationProps
) => {
  const { notification } = props
  const { rank } = notification
  const track = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity>
  const navigation = useNotificationNavigation()

  const handlePress = useCallback(() => {
    if (track) {
      navigation.navigate(notification)
    }
  }, [navigation, notification, track])

  if (!track) return null

  const shareText = messages.twitterShareText(track.title)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrending}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <EntityLink entity={track} /> {messages.is} #{rank} {messages.trending}
      </NotificationText>
      <NotificationTwitterButton
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
