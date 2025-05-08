import { useCallback } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import type { FanRemixContestStartedNotification as FanRemixContestStartedNotificationType } from '@audius/common/store'

import { IconTrophy } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink
} from '../Notification'

const messages = {
  title: 'New Remix Contest',
  description: 'started a remix contest for'
}

type FanRemixContestStartedNotificationProps = {
  notification: FanRemixContestStartedNotificationType
}

export const FanRemixContestStartedNotification = (
  props: FanRemixContestStartedNotificationProps
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
