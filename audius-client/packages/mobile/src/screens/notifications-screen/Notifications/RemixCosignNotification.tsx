import { useCallback } from 'react'

import type {
  Nullable,
  RemixCosignNotification as RemixCosignNotificationType,
  TrackEntity
} from '@audius/common'
import { notificationsSelectors } from '@audius/common'
import { View } from 'react-native'

import IconRemix from 'app/assets/images/iconRemix.svg'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { make } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'
import { getTrackRoute } from 'app/utils/routes'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  ProfilePicture,
  NotificationTwitterButton
} from '../Notification'
import { useDrawerNavigation } from '../useDrawerNavigation'
const { getNotificationEntities, getNotificationUser } = notificationsSelectors

const messages = {
  title: 'Remix Co-sign',
  cosign: 'Co-signed your Remix of',
  shareTwitterText: (trackTitle: string, handle: string) =>
    `My remix of ${trackTitle} was Co-Signed by ${handle} on @AudiusProject #Audius`
}

type RemixCosignNotificationProps = {
  notification: RemixCosignNotificationType
}

export const RemixCosignNotification = (
  props: RemixCosignNotificationProps
) => {
  const { notification } = props
  const navigation = useDrawerNavigation()
  const { childTrackId, parentTrackUserId } = notification
  const user = useSelectorWeb((state) =>
    getNotificationUser(state, notification)
  )
  // TODO: casting from EntityType to TrackEntity here, but
  // getNotificationEntities should be smart enough based on notif type
  const tracks = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  ) as Nullable<TrackEntity[]>

  const childTrack = tracks?.find(({ track_id }) => track_id === childTrackId)
  const parentTrack = tracks?.find(
    ({ owner_id }) => owner_id === parentTrackUserId
  )
  const parentTrackTitle = parentTrack?.title

  const handlePress = useCallback(() => {
    if (childTrack) {
      navigation.navigate({
        native: {
          screen: 'Track',
          params: { id: childTrack.track_id, fromNotifications: true }
        },
        web: {
          route: getTrackRoute(childTrack)
        }
      })
    }
  }, [childTrack, navigation])

  const handleTwitterShareData = useCallback(
    (handle: string | undefined) => {
      if (parentTrackTitle && handle) {
        const shareText = messages.shareTwitterText(parentTrackTitle, handle)
        const analytics = make({
          eventName: EventNames.NOTIFICATIONS_CLICK_REMIX_COSIGN_TWITTER_SHARE,
          text: shareText
        })
        return { shareText, analytics }
      }
      return null
    },
    [parentTrackTitle]
  )

  if (!user || !childTrack || !parentTrack) return null

  const twitterUrl = getTrackRoute(childTrack, true)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconRemix}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={user} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={user} /> {messages.cosign}{' '}
            <EntityLink entity={parentTrack} />
          </NotificationText>
        </View>
      </View>
      <NotificationTwitterButton
        type='dynamic'
        url={twitterUrl}
        handle={user.handle}
        shareData={handleTwitterShareData}
      />
    </NotificationTile>
  )
}
