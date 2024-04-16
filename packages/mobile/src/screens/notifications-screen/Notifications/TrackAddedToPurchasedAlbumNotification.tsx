import { useCallback } from 'react'

import { useProxySelector } from '@audius/common/hooks'
import type { TrackAddedToPurchasedAlbumNotification as TrackAddedToPurchasedAlbumNotificationType } from '@audius/common/store'
import { notificationsSelectors } from '@audius/common/store'
import { View } from 'react-native'

import { IconStars } from '@audius/harmony-native'
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
const { getNotificationEntities } = notificationsSelectors

const messages = {
  title: 'New Release',
  released: ' released a new track ',
  onAlbum: ' on the album you purchased, '
}
type TrackAddedToPurchasedAlbumNotificationProps = {
  notification: TrackAddedToPurchasedAlbumNotificationType
}

export const TrackAddedToPurchasedAlbumNotification = (
  props: TrackAddedToPurchasedAlbumNotificationProps
) => {
  const { notification } = props
  const navigation = useNotificationNavigation()
  const entities = useProxySelector(
    (state) => getNotificationEntities(state, notification),
    [notification]
  )
  const { track, playlist } = entities
  const playlistOwner = playlist.user

  const handlePress = useCallback(() => {
    if (playlist) {
      navigation.navigate(notification)
    }
  }, [playlist, navigation, notification])

  if (!playlistOwner || !track || !playlist) return null

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconStars}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <NotificationProfilePicture profile={playlistOwner} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={playlistOwner} />
            {messages.released}
            <EntityLink entity={track} />
            {messages.onAlbum}
            <EntityLink entity={playlist} />
          </NotificationText>
        </View>
      </View>
    </NotificationTile>
  )
}
