import { useCallback } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import type { FanRemixContestEndedNotification as FanRemixContestEndedNotificationType } from '@audius/common/store'

import { IconTrophy } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  UserNameLink,
  EntityLink
} from '../Notification'

const messages = {
  title: 'Remix Contest Ended',
  description:
    "'s remix contest has closed and winners will be announced soon. Good luck!"
}

type FanRemixContestEndedNotificationProps = {
  notification: FanRemixContestEndedNotificationType
}

export const FanRemixContestEndedNotification = (
  props: FanRemixContestEndedNotificationProps
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
        <UserNameLink user={user} /> {messages.description}{' '}
        <EntityLink entity={track} />
      </NotificationText>
    </NotificationTile>
  )
}
