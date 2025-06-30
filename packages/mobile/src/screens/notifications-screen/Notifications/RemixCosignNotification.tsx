import { useCallback } from 'react'

import { useNotificationEntities } from '@audius/common/api'
import type {
  TrackEntity,
  RemixCosignNotification as RemixCosignNotificationType
} from '@audius/common/store'
import { View } from 'react-native'

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
  NotificationProfilePicture,
  NotificationXButton
} from '../Notification'

const messages = {
  title: 'Remix was Co-signed',
  cosign: 'Co-signed your Remix of',
  shareXText: (trackTitle: string, handle: string) =>
    `My remix of ${trackTitle} was Co-Signed by ${handle} on @audius #Audius $AUDIO`
}

type RemixCosignNotificationProps = {
  notification: RemixCosignNotificationType
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
) => {
  const { notification } = props
  const navigation = useNotificationNavigation()
  const { childTrackId, parentTrackUserId } = notification

  const entities = useNotificationEntities(notification)
  const tracks = entities as TrackEntity[]
  const user = tracks?.[0]?.user

  const childTrack = tracks?.find(({ track_id }) => track_id === childTrackId)
  const parentTrack = tracks?.find(
    ({ owner_id }) => owner_id === parentTrackUserId
  )
  const parentTrackTitle = parentTrack?.title

  const handlePress = useCallback(() => {
    if (childTrack) {
      navigation.navigate(notification)
    }
  }, [childTrack, navigation, notification])

  const handleXShareData = useCallback(
    (handle: string | undefined) => {
      if (parentTrackTitle && handle) {
        const shareText = messages.shareXText(parentTrackTitle, handle)
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

  const xUrl = getTrackRoute(childTrack, true)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconRemix}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <NotificationProfilePicture profile={user} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={user} /> {messages.cosign}{' '}
            <EntityLink entity={parentTrack} />
          </NotificationText>
        </View>
      </View>
      <NotificationXButton
        type='dynamic'
        url={xUrl}
        handle={user.handle}
        shareData={handleXShareData}
      />
    </NotificationTile>
  )
}
