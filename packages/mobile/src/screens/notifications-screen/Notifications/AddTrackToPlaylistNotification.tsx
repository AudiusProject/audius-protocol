import { useCallback } from 'react'

import { getNotificationEntities } from 'audius-client/src/common/store/notifications/selectors'
import { AddTrackToPlaylist } from 'audius-client/src/common/store/notifications/types'
import { isEqual } from 'lodash'
import { View } from 'react-native'

import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import {
  NotificationHeader,
  NotificationText,
  NotificationTile,
  NotificationTitle,
  EntityLink,
  UserNameLink,
  ProfilePicture
} from '../Notification'
import { getEntityRoute, getEntityScreen } from '../Notification/utils'
import { useDrawerNavigation } from '../useDrawerNavigation'

const messages = {
  title: 'Track Added to Playlist',
  addedTrack: ' added your track ',
  toPlaylist: ' to their playlist '
}
type AddTrackToPlaylistNotificationProps = {
  notification: AddTrackToPlaylist
}

export const AddTrackToPlaylistNotification = (
  props: AddTrackToPlaylistNotificationProps
) => {
  const { notification } = props
  const entities = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  )
  const { track, playlist } = entities
  const playlistOwner = playlist.user

  const navigation = useDrawerNavigation()

  const handlePress = useCallback(() => {
    if (playlist) {
      navigation.navigate({
        native: getEntityScreen(playlist),
        web: { route: getEntityRoute(playlist) }
      })
    }
  }, [playlist, navigation])

  return (
    <NotificationTile notification={notification} onPress={handlePress}>
      <NotificationHeader icon={IconPlaylists}>
        <NotificationTitle>{messages.title}</NotificationTitle>
      </NotificationHeader>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ProfilePicture profile={playlistOwner} />
        <View style={{ flex: 1 }}>
          <NotificationText>
            <UserNameLink user={playlistOwner} />
            {messages.addedTrack}
            <EntityLink entity={track} />
            {messages.toPlaylist}
            <EntityLink entity={playlist} />
          </NotificationText>
        </View>
      </View>
    </NotificationTile>
  )
}
