import { useCallback } from 'react'

import {
  getNotificationEntities,
  getNotificationUser
} from 'audius-client/src/common/store/notifications/selectors'
import {
  RemixCreate,
  TrackEntity
} from 'audius-client/src/common/store/notifications/types'

import IconRemix from 'app/assets/images/iconRemix.svg'
import { useSelectorWeb, isEqual } from 'app/hooks/useSelectorWeb'
import { getTrackRoute } from 'app/utils/routes'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink
} from '../Notification'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'New Remix of Your Track',
  by: 'by'
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
  const user = useSelectorWeb(state => getNotificationUser(state, notification))
  const tracks = useSelectorWeb(
    state => getNotificationEntities(state, notification),
    isEqual
  )

  const childTrack = tracks?.find(
    (track): track is TrackEntity =>
      'track_id' in track && track.track_id === childTrackId
  )

  const parentTrack = tracks?.find(
    (track): track is TrackEntity =>
      'track_id' in track && track.track_id === parentTrackId
  )

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

  if (!user || !childTrack || !parentTrack) return null

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
    </NotificationTile>
  )
}
