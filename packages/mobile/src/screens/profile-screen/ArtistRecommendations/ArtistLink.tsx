import type { User } from '@audius/common/models'
import { TouchableOpacity, View } from 'react-native'

import { Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { makeStyles } from 'app/styles'
import type { GestureResponderHandler } from 'app/types/gesture'

type ArtistLinkProps = {
  artist: User
  onPress: GestureResponderHandler
}

const useStyles = makeStyles(() => ({
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  artist: {
    marginBottom: 0,
    marginTop: 0
  },
  badges: {
    top: 1
  }
}))

export const ArtistLink = (props: ArtistLinkProps) => {
  const styles = useStyles()
  const { artist, onPress } = props
  const { name } = artist

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.artistInfo}>
        <Text color='secondary' variant='h3' style={styles.artist}>
          {name}
        </Text>
        <UserBadges
          style={styles.badges}
          user={artist}
          hideName
          badgeSize={8}
        />
      </View>
    </TouchableOpacity>
  )
}
