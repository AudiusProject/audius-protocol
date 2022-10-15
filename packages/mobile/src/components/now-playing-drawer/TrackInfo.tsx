import type { Nullable, Track, User } from '@audius/common'
import { TouchableOpacity, View } from 'react-native'

import { Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges/UserBadges'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

const useStyles = makeStyles(({ typography, spacing }) => ({
  root: {
    alignItems: 'center'
  },
  trackTitle: {
    textAlign: 'center'
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(3)
  },
  artist: {
    marginBottom: 0,
    fontFamily: typography.fontByWeight.medium
  }
}))

type TrackInfoProps = {
  track: Nullable<Track>
  user: Nullable<User>
  onPressArtist: GestureResponderHandler
  onPressTitle: GestureResponderHandler
}

export const TrackInfo = ({
  onPressArtist,
  onPressTitle,
  track,
  user
}: TrackInfoProps) => {
  const styles = useStyles()
  return (
    <View style={styles.root}>
      {user && track ? (
        <>
          <TouchableOpacity onPress={onPressTitle}>
            <Text numberOfLines={2} style={styles.trackTitle} variant='h1'>
              {track.title}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPressArtist}>
            <View style={styles.artistInfo}>
              <Text
                numberOfLines={1}
                style={styles.artist}
                variant='h1'
                color='secondary'
              >
                {user.name}
              </Text>
              <UserBadges user={user} badgeSize={12} hideName />
            </View>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  )
}
