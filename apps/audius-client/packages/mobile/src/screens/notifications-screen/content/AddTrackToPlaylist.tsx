import {
  AddTrackToPlaylist as AddTrackToPlaylistNotification,
  Entity as EntityType
} from 'audius-client/src/common/store/notifications/types'
import { Text, View } from 'react-native'

import { makeStyles } from 'app/styles'
import { useTheme } from 'app/utils/theme'

import Entity from './Entity'
import TwitterShare from './TwitterShare'
import User from './User'

const useStyles = makeStyles(({ typography, spacing }) => ({
  text: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.medium,
    marginBottom: spacing(2)
  }
}))

type AddTrackToPlaylistProps = {
  notification: AddTrackToPlaylistNotification
}

const AddTrackToPlaylist = ({ notification }: AddTrackToPlaylistProps) => {
  const styles = useStyles()
  const { entities } = notification
  const { track, playlist } = entities
  const playlistOwner = playlist.user

  const textStyle = useTheme(styles.text, {
    color: 'neutral'
  })

  if (!playlistOwner) return null

  return (
    <View style={styles.text}>
      <Text style={textStyle}>
        <User user={playlistOwner} />
        {' added your track '}
        <Entity entity={track} entityType={EntityType.Track} />
        {' to their playlist '}
        <Entity entity={playlist} entityType={EntityType.Playlist} />
      </Text>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default AddTrackToPlaylist
