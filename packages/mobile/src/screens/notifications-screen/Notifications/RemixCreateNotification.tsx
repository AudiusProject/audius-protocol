import { useCallback } from 'react'

import { useTrack, useUser } from '@audius/common/api'
import type { RemixCreateNotification as RemixCreateNotificationType } from '@audius/common/store'

import { IconRemix } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'
import { EventNames } from 'app/types/analytics'
import { getTrackRoute } from 'app/utils/routes'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  NotificationTwitterButton
} from '../Notification'

const messages = {
  title: 'New Remix of Your Track',
  by: 'by',
  shareTwitterText: (trackTitle: string, handle: string) =>
    `New remix of ${trackTitle} by ${handle} on @audius #Audius`
}

type RemixCreateNotificationProps = {
  notification: RemixCreateNotificationType
}

export const RemixCreateNotification = (
  props: RemixCreateNotificationProps
) => {
  const { notification } = props
  const { childTrackId, parentTrackId } = notification

  const navigation = useNotificationNavigation()
  const { data: user } = useUser(notification.userId)

  const { data: childTrack } = useTrack(childTrackId)
  const { data: parentTrack } = useTrack(parentTrackId)

  const parentTrackTitle = parentTrack?.title

  const handlePress = useCallback(() => {
    if (childTrack) {
      navigation.navigate(notification)
    }
  }, [childTrack, navigation, notification])

  const handleTwitterShareData = useCallback(
    (handle: string | undefined) => {
      if (parentTrackTitle && handle) {
        const shareText = messages.shareTwitterText(parentTrackTitle, handle)
        const analytics = {
          eventName: EventNames.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE,
          text: shareText
        } as const
        return { shareText, analytics }
      }
      return null
    },
    [parentTrackTitle]
  )

  if (!user || !childTrack || !parentTrack) return null

  const twitterUrl = getTrackRoute(parentTrack, true)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconRemix}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <NotificationText>
        <EntityLink entity={childTrack} /> {messages.by}{' '}
        <UserNameLink user={user} />
      </NotificationText>
      <NotificationTwitterButton
        type='dynamic'
        url={twitterUrl}
        handle={user.handle}
        shareData={handleTwitterShareData}
      />
    </NotificationTile>
  )
}
