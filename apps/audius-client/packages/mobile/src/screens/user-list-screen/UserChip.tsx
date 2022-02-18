import { useCallback } from 'react'

import { ID } from 'audius-client/src/common/models/Identifiers'
import { User } from 'audius-client/src/common/models/User'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { View, Text, Pressable } from 'react-native'

import { ProfilePhoto, FollowButton } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

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
    padding: spacing(3)
  },
  details: { flexDirection: 'row', flex: 1 },
  photo: { height: 42, width: 42, marginRight: spacing(2) },
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
    navigation.navigate({
      native: { screen: 'profile', params: { handle } },
      web: { route: handle }
    })
  }, [navigation, handle])

  return (
    <View style={styles.root}>
      <Pressable style={styles.details} onPress={handlePress}>
        <ProfilePhoto profile={user} style={styles.photo} />
        <View>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <UserBadges user={user} badgeSize={10} hideName />
          <Text style={styles.followers}>
            {follower_count} {messages.followers(follower_count)}
          </Text>
        </View>
      </Pressable>
      {user.user_id === currentUserId ? null : (
        <FollowButton profile={user} noIcon />
      )}
    </View>
  )
}
