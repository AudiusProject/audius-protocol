import { useCallback } from 'react'

import { useNotificationEntities } from '@audius/common/api'
import type { TrackAddedToPurchasedAlbumNotification as TrackAddedToPurchasedAlbumNotificationType } from '@audius/common/store'
import { View } from 'react-native'

import { IconPlaylists } from '@audius/harmony-native'
import { useNotificationNavigation } from 'app/hooks/useNotificationNavigation'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  NotificationProfilePicture
} from '../Notification'

const messages = {
  title: 'Track Added to Album',
  addedTrack: ' added your track ',
  toAlbum: ' to their album '
}

type TrackAddedToPurchasedAlbumNotificationProps = {
  notification: TrackAddedToPurchasedAlbumNotificationType
}

export const TrackAddedToPurchasedAlbumNotification = (
  props: TrackAddedToPurchasedAlbumNotificationProps
) => {
  const { notification } = props
  const navigation = useNotificationNavigation()
  const entities = useNotificationEntities(notification)
  const { track, playlist } = entities
  const playlistOwner = playlist?.user

  const handlePress = useCallback(() => {
    if (playlist) {
      navigation.navigate(notification)
    }
  }, [playlist, navigation, notification])

  if (!playlistOwner || !track || !playlist) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconPlaylists}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <NotificationProfilePicture profile={playlistOwner} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={playlistOwner} />
            {messages.addedTrack}
            <EntityLink entity={track} />
            {messages.toAlbum}
            <EntityLink entity={playlist} />
          </NotificationText>
        </View>
      </View>
    </NotificationTile>
  )
}
