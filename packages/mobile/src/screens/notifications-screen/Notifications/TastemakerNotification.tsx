import { useCallback } from 'react'

import { Name } from '@audius/common/models'
import type {
  TrackEntity,
  TastemakerNotification as TastemakerNotificationType
} from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { make } from 'common/store/analytics/actions'
import { useSelector } from 'react-redux'

import { IconTastemaker } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  EntityLink,
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  NotificationTwitterButton
} from '../Notification'
const { getNotificationEntity, getNotificationUser } = notificationsSelectors

const messages = {
  title: 'You’re a Tastemaker!',
  is: 'is',
  tastemaker: 'now trending thanks to you! Great work 🙌',
  twitterShare: (trackOwnerHandle: string, trackTitle: string) => {
    return `I was one of the first to discover ${trackTitle} by ${trackOwnerHandle} on @audius and it just made it onto trending! #Audius #AudiusTastemaker`
  }
}

type TastemakerNotificationProps = {
  notification: TastemakerNotificationType
}

export const TastemakerNotification = (props: TastemakerNotificationProps) => {
  const { notification } = props
  const navigation = useNotificationNavigation()
  const track = useSelector((state) =>
    getNotificationEntity(state, notification)
  ) as Nullable<TrackEntity>
  const trackOwnerUser = useSelector((state) =>
    getNotificationUser(state, notification)
  )

  const handlePress = useCallback(() => {
    if (track) {
      navigation.navigate(notification)
    }
  }, [track, navigation, notification])

  const handleShare = useCallback(
    (trackOwnerHandle: string) => {
      const trackTitle = track?.title || ''
      const shareText = messages.twitterShare(trackOwnerHandle, trackTitle)
      const analytics = make(
        Name.NOTIFICATIONS_CLICK_TASTEMAKER_TWITTER_SHARE,
        { text: shareText }
      )
      return { shareText: track ? shareText : '', analytics }
    },
    [track]
  )

  if (!track || !trackOwnerUser) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTastemaker}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <EntityLink entity={track} /> {messages.is} {messages.tastemaker}
      </NotificationText>
      <NotificationTwitterButton
        type='dynamic'
        handle={trackOwnerUser.handle}
        shareData={handleShare}
      />
    </NotificationTile>
  )
}
