import { ProfileUser } from 'audius-client/src/pages/profile-page/store/types'
import { Text, View } from 'react-native'

import { makeStyles } from 'app/styles/makeStyles'

const messages = {
  tracks: 'tracks',
  followers: 'followers',
  following: 'following'
}

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing(2)
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing(4)
  },
  value: {
    fontSize: 14,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.neutral,
    marginRight: spacing(1)
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontByWeight.demiBold,
    color: palette.neutralLight4,
    textTransform: 'capitalize'
  }
}))

type ProfileMetricsProps = {
  profile: ProfileUser
}

export const ProfileMetrics = ({ profile }: ProfileMetricsProps) => {
  const styles = useStyles()

  return (
    <View style={styles.root}>
      <View style={styles.metric}>
        <Text style={styles.value}>{profile.track_count}</Text>
        <Text style={styles.label}>{messages.tracks}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.value}>{profile.follower_count}</Text>
        <Text style={styles.label}>{messages.followers}</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.value}>{profile.followee_count}</Text>
        <Text style={styles.label}>{messages.following}</Text>
      </View>
    </View>
  )
}
