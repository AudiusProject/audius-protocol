import { User } from 'audius-client/src/common/models/User'
import { View, Text } from 'react-native'

import { FollowButton } from 'app/components/user'
import { useAccountUser } from 'app/hooks/selectors'
import { makeStyles } from 'app/styles'

import { EditProfileButton } from './EditProfileButton'
import { SubscribeButton } from './SubscribeButton'

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  username: {
    ...typography.h1,
    color: palette.neutral
  },
  handle: {
    ...typography.h4,
    color: palette.neutralLight4
  },
  followsYou: {
    color: palette.neutralLight4,
    borderRadius: 4,
    overflow: 'hidden',
    borderColor: palette.neutralLight4,
    borderWidth: 1,
    paddingVertical: 3,
    width: spacing(20),
    textAlign: 'center',
    fontFamily: typography.fontByWeight.heavy,
    fontSize: 10,
    textTransform: 'uppercase'
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(4)
  },
  actionButtons: {
    flexDirection: 'row',
    position: 'relative',
    alignSelf: 'flex-start'
  },
  followButton: {
    width: 110
  }
}))

const messages = {
  followsYou: 'Follows You'
}

type ProfileInfoProps = {
  profile: User
  onFollow: () => void
}

export const ProfileInfo = (props: ProfileInfoProps) => {
  const { profile, onFollow } = props
  const styles = useStyles()
  const { does_current_user_follow, does_follow_current_user } = profile
  const accountUser = useAccountUser()
  const isOwner = accountUser?.user_id === profile.user_id

  return (
    <View style={styles.info}>
      <View>
        <Text accessibilityRole='header' style={styles.username}>
          {profile.name}
        </Text>
        <Text style={styles.handle}>@{profile.handle}</Text>
        {does_follow_current_user ? (
          <Text style={styles.followsYou}>{messages.followsYou}</Text>
        ) : null}
      </View>
      <View style={styles.actionButtons}>
        {isOwner ? (
          <EditProfileButton style={styles.followButton} />
        ) : (
          <>
            {does_current_user_follow ? (
              <SubscribeButton profile={profile} />
            ) : null}
            <FollowButton
              style={styles.followButton}
              profile={profile}
              onPress={onFollow}
            />
          </>
        )}
      </View>
    </View>
  )
}
