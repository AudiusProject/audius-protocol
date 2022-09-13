import { FollowSource } from '@audius/common'
import { View, Text } from 'react-native'
import { useSelector } from 'react-redux'

import { FollowButton, FollowsYouChip } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { flexRowCentered, makeStyles } from 'app/styles'

import { EditProfileButton } from './EditProfileButton'
import { SubscribeButton } from './SubscribeButton'
import { getIsOwner, useIsProfileLoaded, useSelectProfile } from './selectors'

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  username: {
    ...typography.h1,
    color: palette.neutral
  },
  name: {
    ...flexRowCentered()
  },
  badges: {
    marginBottom: 6,
    marginLeft: 2
  },
  handleInfo: {
    marginTop: -6,
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    flexWrap: 'wrap',
    maxWidth: 200
  },
  handle: {
    flexShrink: 0,
    marginRight: spacing(2),
    textAlignVertical: 'bottom'
  },
  handleText: {
    marginTop: 6,
    ...typography.h4,
    color: palette.neutralLight4
  },
  followsYou: {
    marginTop: -6,
    borderRadius: 4,
    overflow: 'hidden',
    borderColor: palette.neutralLight4,
    borderWidth: 1,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2)
  },
  followsYouText: {
    color: palette.neutralLight4,
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

type ProfileInfoProps = {
  onFollow: () => void
}

export const ProfileInfo = (props: ProfileInfoProps) => {
  const { onFollow } = props
  const styles = useStyles()
  const isProfileLoaded = useIsProfileLoaded()

  const profile = useSelectProfile([
    'user_id',
    'name',
    'handle',
    'does_current_user_follow',
    'does_follow_current_user'
  ])

  const { name, handle, does_current_user_follow, does_follow_current_user } =
    profile

  const isOwner = useSelector(getIsOwner)
  const profileButton = isOwner ? (
    <EditProfileButton style={styles.followButton} />
  ) : (
    <>
      {does_current_user_follow ? <SubscribeButton profile={profile} /> : null}
      <FollowButton
        style={styles.followButton}
        profile={profile}
        onPress={onFollow}
        followSource={FollowSource.PROFILE_PAGE}
      />
    </>
  )

  return (
    <View pointerEvents='box-none' style={styles.info}>
      <View>
        <View style={styles.name}>
          <Text accessibilityRole='header' style={styles.username}>
            {name}
          </Text>
          <UserBadges
            user={profile}
            badgeSize={12}
            style={styles.badges}
            hideName
          />
        </View>
        <View style={styles.handleInfo}>
          <View style={styles.handle}>
            <Text style={styles.handleText}>@{handle}</Text>
          </View>
          {does_follow_current_user ? <FollowsYouChip /> : null}
        </View>
      </View>
      <View style={styles.actionButtons}>
        {isProfileLoaded ? profileButton : null}
      </View>
    </View>
  )
}
