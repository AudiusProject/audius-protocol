import { useCallback } from 'react'

import { useProfileUser } from '@audius/common/api'
import {
  followingUserListActions,
  followersUserListActions
} from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { Pressable, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'

import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

const { setFollowers } = followersUserListActions
const { setFollowing } = followingUserListActions

const messages = {
  tracks: (count: number) => (count === 1 ? 'track' : 'tracks'),
  playlists: (count: number) => (count === 1 ? 'playlist' : 'playlists'),
  followers: (count: number) => (count === 1 ? 'follower' : 'followers'),
  following: 'following'
}

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
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
  const {
    user_id,
    track_count = 0,
    playlist_count = 0,
    follower_count = 0,
    followee_count = 0
  } = useProfileUser({
    select: (user) => ({
      user_id: user.user_id,
      track_count: user.track_count,
      playlist_count: user.playlist_count,
      follower_count: user.follower_count,
      followee_count: user.followee_count
    })
  }).user ?? {}

  const navigation = useNavigation()
  const dispatch = useDispatch()

  const handlePressFollowers = useCallback(() => {
    if (user_id) {
      dispatch(setFollowers(user_id))
      navigation.push('Followers', { userId: user_id })
    }
  }, [dispatch, user_id, navigation])

  const handlePressFollowing = useCallback(() => {
    if (user_id) {
      dispatch(setFollowing(user_id))
      navigation.push('Following', { userId: user_id })
    }
  }, [dispatch, user_id, navigation])

  return (
    <View pointerEvents='box-none' style={styles.root}>
      {track_count === 0 ? (
        <View style={styles.metric}>
          <Text style={styles.value}>{formatCount(playlist_count)}</Text>
          <Text style={styles.label}>{messages.playlists(playlist_count)}</Text>
        </View>
      ) : (
        <View style={styles.metric}>
          <Text style={styles.value}>{formatCount(track_count)}</Text>
          <Text style={styles.label}>{messages.tracks(track_count)}</Text>
        </View>
      )}
      <Pressable style={styles.metric} onPress={handlePressFollowers}>
        <Text style={styles.value}>{formatCount(follower_count)}</Text>
        <Text style={styles.label}>{messages.followers(follower_count)}</Text>
      </Pressable>
      <Pressable style={styles.metric} onPress={handlePressFollowing}>
        <Text style={styles.value}>{formatCount(followee_count)}</Text>
        <Text style={styles.label}>{messages.following}</Text>
      </Pressable>
    </View>
  )
}
