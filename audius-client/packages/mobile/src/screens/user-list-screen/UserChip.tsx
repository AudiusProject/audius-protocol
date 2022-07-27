import { useCallback } from 'react'

import type { ID, User, Nullable } from '@audius/common'
import { FollowSource } from '@audius/common'
import { View, Text, Pressable } from 'react-native'

import { ProfilePicture, FollowButton } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { formatCount } from 'app/utils/format'

const messages = {
  followers: (followerCount: number) =>
    followerCount === 1 ? 'Follower' : 'Followers',
  follow: 'Follow',
  following: 'Following'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing(3),
    backgroundColor: palette.white
  },
  details: { flexDirection: 'row', flex: 1 },
  userInfo: { flex: 1, marginRight: spacing(4) },
  photo: { height: 42, width: 42, marginRight: spacing(2) },
  nameRoot: { flexDirection: 'row' },
  name: { ...typography.h3, color: palette.neutral },
  followers: { ...typography.h4, color: palette.neutral }
}))

type UserChipProps = {
  user: User
  currentUserId: Nullable<ID>
}

export const UserChip = (props: UserChipProps) => {
  const { user, currentUserId } = props
  const { handle, name, follower_count } = user
  const styles = useStyles()

  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.push({
      native: { screen: 'Profile', params: { handle } },
      web: { route: handle }
    })
  }, [navigation, handle])

  return (
    <View style={styles.root}>
      <Pressable style={styles.details} onPress={handlePress}>
        <ProfilePicture profile={user} style={styles.photo} />
        <View style={styles.userInfo}>
          <View style={styles.nameRoot}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <UserBadges user={user} badgeSize={10} hideName />
          </View>
          <Text style={styles.followers}>
            {formatCount(follower_count)} {messages.followers(follower_count)}
          </Text>
        </View>
      </Pressable>
      {user.user_id === currentUserId ? null : (
        <FollowButton
          profile={user}
          noIcon
          followSource={FollowSource.USER_LIST}
        />
      )}
    </View>
  )
}
