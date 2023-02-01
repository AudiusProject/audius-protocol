import type { User } from '@audius/common'
import { View } from 'react-native'

import { Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    display: 'flex',
    flexDirection: 'row'
  },
  profilePicture: {
    width: spacing(12),
    height: spacing(12),
    borderWidth: 1,
    borderColor: palette.neutralLight9
  },
  userContainer: {
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 2,
    marginLeft: spacing(2),
    marginBottom: spacing(2)
  },
  userNameContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: spacing(1)
  },
  userName: {
    fontSize: typography.fontSize.large,
    fontWeight: 'bold',
    color: palette.neutral
  },
  handle: {
    fontSize: typography.fontSize.small
  }
}))

export const ChatUser = ({ user }: { user: User }) => {
  const styles = useStyles()

  return (
    <View style={styles.root}>
      <ProfilePicture profile={user} style={styles.profilePicture} />
      <View style={styles.userContainer}>
        <View style={styles.userNameContainer}>
          <Text style={styles.userName}>{user.name}</Text>
          <UserBadges user={user} hideName />
        </View>
        <Text style={styles.handle}>@{user.handle}</Text>
      </View>
    </View>
  )
}
