import { useCallback } from 'react'

import { chatActions, chatSelectors } from '@audius/common'
import type { User } from '@audius/common'
import { Text, View, TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconUser from 'app/assets/images/iconUser.svg'
import { ProfilePicture } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const { createChat } = chatActions
const { getCanMessageUser } = chatSelectors

const messages = {
  followsYou: 'Follows You',
  followers: 'Followers',
  cannotMessage: 'Cannot Be Messaged'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootContainer: {
    backgroundColor: palette.white,
    flexGrow: 1
  },
  profilePicture: {
    height: spacing(18),
    width: spacing(18)
  },
  border: {
    borderBottomColor: palette.neutralLight4,
    borderBottomWidth: 1
  },
  userContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(4)
  },
  userNameContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    marginLeft: spacing(2.5),
    gap: spacing(1)
  },
  userName: {
    fontSize: typography.fontSize.small,
    fontWeight: 'bold',
    color: palette.neutral
  },
  followContainer: {
    marginTop: spacing(1),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  handle: {
    fontSize: typography.fontSize.small,
    color: palette.neutral
  },
  followersContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  followersCount: {
    fontWeight: 'bold',
    marginHorizontal: spacing(1),
    color: palette.neutralLight4,
    fontSize: typography.fontSize.small
  },
  followers: {
    color: palette.neutralLight4,
    fontSize: typography.fontSize.small
  },
  iconUser: {
    height: spacing(4),
    width: spacing(4)
  },
  followsYouTag: {
    fontSize: typography.fontSize.xxs,
    fontFamily: typography.fontByWeight.heavy,
    letterSpacing: 0.64,
    textTransform: 'uppercase',
    color: palette.neutralLight4,
    borderWidth: 1,
    borderRadius: spacing(1),
    borderColor: palette.neutralLight4,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2)
  },
  dim: {
    opacity: 0.5
  }
}))

type ChatUserListItemProps = {
  user: User
}

export const ChatUserListItem = ({ user }: ChatUserListItemProps) => {
  const styles = useStyles()
  const palette = useThemeColors()
  const dispatch = useDispatch()
  const canMessageUser = useSelector((state) =>
    getCanMessageUser(state, user.user_id)
  )

  const handlePress = useCallback(
    (user) => {
      dispatch(createChat({ userIds: [user.user_id] }))
    },
    [dispatch]
  )

  return (
    <TouchableOpacity
      onPress={() => handlePress(user)}
      disabled={!canMessageUser}
    >
      <View style={styles.border}>
        <View
          style={[styles.userContainer, !canMessageUser ? styles.dim : null]}
        >
          <ProfilePicture profile={user} style={styles.profilePicture} />
          <View style={styles.userNameContainer}>
            <UserBadges user={user} nameStyle={styles.userName} />
            <Text style={styles.handle}>@{user.handle}</Text>
            <View style={styles.followContainer}>
              <View style={styles.followersContainer}>
                {canMessageUser ? (
                  <>
                    <IconUser
                      fill={palette.neutralLight4}
                      height={styles.iconUser.height}
                      width={styles.iconUser.width}
                    />
                    <Text style={styles.followersCount}>
                      {user.follower_count}
                    </Text>
                    <Text style={styles.followers}>{messages.followers}</Text>
                  </>
                ) : (
                  <Text style={styles.userName}>{messages.cannotMessage}</Text>
                )}
              </View>
              {user.does_follow_current_user && canMessageUser ? (
                <Text style={styles.followsYouTag}>{messages.followsYou}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
