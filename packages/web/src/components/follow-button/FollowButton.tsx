import { useCallback } from 'react'

import { useFollowUser, useUnfollowUser, useUser } from '@audius/common/api'
import { FollowSource, ID } from '@audius/common/models'
import {
  FollowButton as HarmonyFollowButton,
  FollowButtonProps as HarmonyFollowButtonProps
} from '@audius/harmony'

type FollowButtonProps = HarmonyFollowButtonProps & {
  userId: ID
  source: FollowSource
}

export const FollowButton = (props: FollowButtonProps) => {
  const { userId, ...rest } = props
  const { data: doesCurrentUserFollow } = useUser(userId, {
    select: (user) => user.does_current_user_follow
  })

  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()

  const handleFollow = useCallback(() => {
    followUser({ followeeUserId: userId, source: FollowSource.OVERFLOW })
  }, [followUser, userId])

  const handleUnfollow = useCallback(() => {
    unfollowUser({ followeeUserId: userId, source: FollowSource.OVERFLOW })
  }, [unfollowUser, userId])

  return (
    <HarmonyFollowButton
      {...rest}
      isFollowing={doesCurrentUserFollow}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
    />
  )
}
