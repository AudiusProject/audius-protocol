import { useCallback } from 'react'

import { setFollowers } from 'audius-client/src/common/store/user-list/followers/actions'
import { setFollowing } from 'audius-client/src/common/store/user-list/following/actions'
import { Pressable, Text, View } from 'react-native'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles/makeStyles'
import { formatCount } from 'app/utils/format'

import { useSelectProfile } from './selectors'

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
    lineHeight: 14,
    color: palette.neutral,
    marginRight: spacing(1)
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontByWeight.demiBold,
    lineHeight: 14,
    color: palette.neutralLight4,
    textTransform: 'capitalize'
  }
}))

export const ProfileMetrics = () => {
  const styles = useStyles()
  const { user_id, track_count, follower_count, followee_count } =
    useSelectProfile([
      'user_id',
      'track_count',
      'follower_count',
      'followee_count'
    ])

  const navigation = useNavigation()
  const dispatchWeb = useDispatchWeb()

  const handlePressFollowers = useCallback(() => {
    dispatchWeb(setFollowers(user_id))
    navigation.push({
      native: { screen: 'Followers', params: { userId: user_id } },
      web: { route: '/followers', fromPage: 'profile' }
    })
  }, [dispatchWeb, user_id, navigation])

  const handlePressFollowing = useCallback(() => {
    dispatchWeb(setFollowing(user_id))
    navigation.push({
      native: { screen: 'Following', params: { userId: user_id } },
      web: { route: '/following', fromPage: 'profile' }
    })
  }, [dispatchWeb, user_id, navigation])

  return (
    <View pointerEvents='box-none' style={styles.root}>
      <View style={styles.metric}>
        <Text style={styles.value}>{formatCount(track_count)}</Text>
        <Text style={styles.label}>{messages.tracks}</Text>
      </View>
      <Pressable style={styles.metric} onPress={handlePressFollowers}>
        <Text style={styles.value}>{formatCount(follower_count)}</Text>
        <Text style={styles.label}>{messages.followers}</Text>
      </Pressable>
      <Pressable style={styles.metric} onPress={handlePressFollowing}>
        <Text style={styles.value}>{formatCount(followee_count)}</Text>
        <Text style={styles.label}>{messages.following}</Text>
      </Pressable>
    </View>
  )
}
