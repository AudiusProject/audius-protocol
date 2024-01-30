import { useEffect } from 'react'

import {
  accountSelectors,
  chatSelectors,
  chatActions,
  profilePageSelectors,
  reachabilitySelectors,
  FeatureFlags
} from '@audius/common'
import { FollowSource } from '@audius/common/models'
import { View, Text } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { FollowButton, FollowsYouChip } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useRoute } from 'app/hooks/useRoute'
import { flexRowCentered, makeStyles } from 'app/styles'

import { EditProfileButton } from './EditProfileButton'
import { MessageButton } from './MessageButton'
import { MessageLockedButton } from './MessageLockedButton'
import { SubscribeButton } from './SubscribeButton'
import { useSelectProfile } from './selectors'

const { getUserHandle } = accountSelectors
const { getCanCreateChat } = chatSelectors
const { fetchBlockees, fetchBlockers, fetchPermissions } = chatActions
const { getProfileUserId } = profilePageSelectors

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  name: {
    ...flexRowCentered(),
    marginRight: spacing(2),
    marginBottom: spacing(1)
  },
  username: {
    ...typography.h1,
    color: palette.neutral,
    marginBottom: 0 // Override h1 bottom margin for this layout to work
  },
  badges: {
    marginTop: 2,
    marginLeft: 2,
    flexGrow: 1
  },
  handleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1
  },
  handle: {
    marginRight: spacing(2),
    textAlignVertical: 'bottom'
  },
  handleText: {
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
  info: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginBottom: spacing(2)
  },
  text: {
    marginTop: spacing(2),
    flexShrink: 1
  },
  actionButtons: {
    flexDirection: 'row',
    position: 'relative',
    justifyContent: 'flex-end',
    height: spacing(7)
  },
  followButton: {
    width: 110,
    height: spacing(7)
  }
}))

type ProfileInfoProps = {
  onFollow: () => void
}

export const ProfileInfo = (props: ProfileInfoProps) => {
  const { onFollow } = props
  const { params } = useRoute<'Profile'>()
  const { getIsReachable } = reachabilitySelectors
  const isReachable = useSelector(getIsReachable)
  const accountHandle = useSelector(getUserHandle)
  const styles = useStyles()
  const dispatch = useDispatch()
  const { isEnabled: isChatEnabled } = useFeatureFlag(FeatureFlags.CHAT_ENABLED)

  const profileUserId = useSelector((state) =>
    getProfileUserId(state, params.handle)
  )
  const { canCreateChat } = useSelector((state) =>
    getCanCreateChat(state, { userId: profileUserId })
  )

  useEffect(() => {
    dispatch(fetchBlockees())
    dispatch(fetchBlockers())
  }, [dispatch, params, profileUserId])

  useEffect(() => {
    if (profileUserId) {
      dispatch(fetchPermissions({ userIds: [profileUserId] }))
    }
  }, [dispatch, profileUserId])

  const profile = useSelectProfile([
    'user_id',
    'name',
    'handle',
    'does_current_user_follow',
    'is_verified'
  ])

  const { user_id, name, handle, does_current_user_follow } = profile

  const isOwner =
    params.handle === 'accountUser' ||
    params.handle?.toLowerCase() === accountHandle?.toLowerCase() ||
    handle === accountHandle

  const actionButtons =
    isOwner && handle ? (
      <EditProfileButton style={styles.followButton} />
    ) : (
      <>
        {isChatEnabled && !isOwner ? (
          canCreateChat ? (
            <MessageButton profile={profile} />
          ) : (
            <MessageLockedButton userId={profile.user_id} />
          )
        ) : null}
        {does_current_user_follow ? (
          <SubscribeButton profile={profile} />
        ) : null}
        <FollowButton
          style={styles.followButton}
          userId={user_id}
          onPress={onFollow}
          followSource={FollowSource.PROFILE_PAGE}
        />
      </>
    )

  return (
    <View pointerEvents='box-none' style={styles.info}>
      <View pointerEvents='box-none' style={styles.actionButtons}>
        {isReachable ? actionButtons : null}
      </View>
      <View pointerEvents='none' style={styles.text}>
        <View style={styles.name}>
          <Text
            accessibilityRole='header'
            numberOfLines={1}
            style={styles.username}
          >
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
            <Text style={styles.handleText} numberOfLines={1}>
              @{handle}
            </Text>
          </View>
          <FollowsYouChip userId={profile.user_id} />
        </View>
      </View>
    </View>
  )
}
