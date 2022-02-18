import { useCallback } from 'react'

import { ProfileUser } from 'audius-client/src/common/store/pages/profile/types'
import { setFollowers } from 'audius-client/src/common/store/user-list/followers/actions'
import { Pressable, Text, View } from 'react-native'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
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
  const { user_id, track_count, follower_count, followee_count } = profile

  const navigation = useNavigation()
  const dispatchWeb = useDispatchWeb()

  const handlePressFollowers = useCallback(() => {
    dispatchWeb(setFollowers(user_id))
    navigation.navigate({
      native: { screen: 'FollowersScreen', params: undefined },
      web: { route: '/followers' }
    })
  }, [dispatchWeb, user_id, navigation])

  return (
    <View style={styles.root}>
      <View style={styles.metric}>
        <Text style={styles.value}>{track_count}</Text>
        <Text style={styles.label}>{messages.tracks}</Text>
      </View>
      <Pressable style={styles.metric} onPress={handlePressFollowers}>
        <Text style={styles.value}>{follower_count}</Text>
        <Text style={styles.label}>{messages.followers}</Text>
      </Pressable>
      <View style={styles.metric}>
        <Text style={styles.value}>{followee_count}</Text>
        <Text style={styles.label}>{messages.following}</Text>
      </View>
    </View>
  )
}
