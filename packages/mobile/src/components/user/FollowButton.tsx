import { useCallback } from 'react'

import { useFollowUser, useUnfollowUser, useUser } from '@audius/common/api'
import type { FollowSource, ID } from '@audius/common/models'
import type { GestureResponderEvent } from 'react-native'

import { FollowButton as HarmonyFollowButton } from '@audius/harmony-native'
import type { FollowButtonProps as HarmonyFollowButtonProps } from '@audius/harmony-native'

type FollowButtonsProps = Partial<HarmonyFollowButtonProps> & {
  userId: ID
  followSource: FollowSource
}

export const FollowButton = (props: FollowButtonsProps) => {
  const { userId, onPress, followSource, ...other } = props

  const { data: isFollowing } = useUser(userId, {
    select: (user) => user?.does_current_user_follow
  })

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
