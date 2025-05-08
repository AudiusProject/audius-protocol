import { useCallback } from 'react'

import { useTrack } from '@audius/common/api'
import type { ArtistRemixContestEndedNotification as ArtistRemixContestEndedNotificationType } from '@audius/common/store'

import { IconTrophy } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle
} from '../Notification'

const messages = {
  title: 'Your Remix Contest Ended',
  description:
    "Your remix contest has ended. Don't forget to contact your winners!"
}

type ArtistRemixContestEndedNotificationProps = {
  notification: ArtistRemixContestEndedNotificationType
}

export const ArtistRemixContestEndedNotification = (
  props: ArtistRemixContestEndedNotificationProps
) => {
  const { notification } = props
  const { entityId } = notification

  const navigation = useNotificationNavigation()
  const { data: track } = useTrack(entityId)

  const handlePress = useCallback(() => {
    if (track) {
      navigation.navigate(notification)
    }
  }, [track, navigation, notification])

  if (!track) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrophy}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>{messages.description}</NotificationText>
    </NotificationTile>
  )
}
