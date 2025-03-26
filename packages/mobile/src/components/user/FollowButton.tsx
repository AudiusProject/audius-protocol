import { useCallback } from 'react'

import { useFollowUser, useUnfollowUser } from '@audius/common/api'
import type { FollowSource, ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import type { GestureResponderEvent } from 'react-native'
import { useSelector } from 'react-redux'

import { FollowButton as HarmonyFollowButton } from '@audius/harmony-native'
import type { FollowButtonProps as HarmonyFollowButtonProps } from '@audius/harmony-native'

const { getUser } = cacheUsersSelectors

type FollowButtonsProps = Partial<HarmonyFollowButtonProps> & {
  userId: ID
  followSource: FollowSource
}

export const FollowButton = (props: FollowButtonsProps) => {
  const { userId, onPress, followSource, ...other } = props

  const isFollowing = useSelector(
    (state) => getUser(state, { id: userId })?.does_current_user_follow
  )

  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      onPress?.(event)
      requestAnimationFrame(() => {
        if (isFollowing) {
          unfollowUser({ followeeUserId: userId, source: followSource })
        } else {
          followUser({ followeeUserId: userId, source: followSource })
        }
      })
    },
    [onPress, isFollowing, userId, followSource, followUser, unfollowUser]
  )

  return (
    <HarmonyFollowButton
      isFollowing={isFollowing}
      onPress={handlePress}
      {...other}
    />
  )
}
