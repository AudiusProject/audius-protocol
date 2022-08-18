import { useCallback } from 'react'

import {
  getNotificationEntities,
  getNotificationUser
} from 'audius-client/src/common/store/notifications/selectors'
import type {
  EntityType,
  RemixCreate,
  TrackEntity
} from 'audius-client/src/common/store/notifications/types'

import IconRemix from 'app/assets/images/iconRemix.svg'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'
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
  NotificationTwitterButton
} from '../Notification'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'New Remix of Your Track',
  by: 'by',
  shareTwitterText: (trackTitle: string, handle: string) =>
    `New remix of ${trackTitle} by ${handle} on @AudiusProject #Audius`
}

type RemixCreateNotificationProps = {
  notification: RemixCreate
}

export const RemixCreateNotification = (
  props: RemixCreateNotificationProps
) => {
  const { notification } = props
  const { childTrackId, parentTrackId } = notification
  const navigation = useDrawerNavigation()
  const user = useSelectorWeb((state) =>
    getNotificationUser(state, notification)
  )
  const tracks = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  ) as EntityType[]

  const childTrack = tracks?.find(
    (track): track is TrackEntity =>
      'track_id' in track && track.track_id === childTrackId
  )

  const parentTrack = tracks?.find(
    (track): track is TrackEntity =>
      'track_id' in track && track.track_id === parentTrackId
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

  const twitterUrl = getTrackRoute(parentTrack, true)

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconRemix}>
        <NotificationTitle>
          {messages.title} <EntityLink entity={parentTrack} />
        </NotificationTitle>
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
