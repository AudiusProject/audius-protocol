import { useCallback } from 'react'

import { useTrack } from '@audius/common/api'
import type { ArtistRemixContestSubmissionsNotification as ArtistRemixContestSubmissionsNotificationType } from '@audius/common/store'

import { IconTrophy } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationBody,
  NotificationTile,
  NotificationTitle,
  EntityLink
} from '../Notification'

const messages = {
  title: 'Remix Contest Milestone!',
  description: 'Your remix contest for ',
  firstSubmission: ' received its first submission!',
  description2: (milestone: number) =>
    ` has reached ${milestone} submission${milestone === 1 ? '' : 's'}!`
}

type ArtistRemixContestSubmissionsNotificationProps = {
  notification: ArtistRemixContestSubmissionsNotificationType
}

export const ArtistRemixContestSubmissionsNotification = (
  props: ArtistRemixContestSubmissionsNotificationProps
) => {
  const { notification } = props
  const { entityId, milestone } = notification

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
      <NotificationBody>
        {messages.description} <EntityLink entity={track} />
        {milestone === 1
          ? messages.firstSubmission
          : messages.description2(milestone)}
      </NotificationBody>
    </NotificationTile>
  )
}
