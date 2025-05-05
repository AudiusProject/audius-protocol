import { useCallback } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import type { RemixContestEndedNotification as RemixContestEndedNotificationType } from '@audius/common/store'

import { IconTrophy } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  UserNameLink
} from '../Notification'

const messages = {
  title: 'Remix Contest Ended',
  description:
    "'s remix contest has closed and winners should be announced soon. Good luck!"
}

type RemixContestEndedNotificationProps = {
  notification: RemixContestEndedNotificationType
}

export const RemixContestEndedNotification = (
  props: RemixContestEndedNotificationProps
) => {
  const { notification } = props
  const { entityId, entityUserId } = notification

  const navigation = useNotificationNavigation()
  const { data: user } = useUser(entityUserId)
  const { data: track } = useTrack(entityId)

  const handlePress = useCallback(() => {
    if (track) {
      navigation.navigate(notification)
    }
  }, [track, navigation, notification])

  if (!user || !track) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconTrophy}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <UserNameLink user={user} /> {messages.description}
      </NotificationText>
    </NotificationTile>
  )
}
