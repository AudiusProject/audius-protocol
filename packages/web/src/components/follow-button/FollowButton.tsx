import { useUser } from '@audius/common/api'
import { FollowSource, ID } from '@audius/common/models'
import { usersSocialActions } from '@audius/common/store'
import {
  FollowButton as HarmonyFollowButton,
  FollowButtonProps as HarmonyFollowButtonProps
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'

const { followUser, unfollowUser } = usersSocialActions

type FollowButtonProps = HarmonyFollowButtonProps & {
  userId: ID
  source: FollowSource
}

export const FollowButton = (props: FollowButtonProps) => {
  const { userId, ...rest } = props
  const dispatch = useDispatch()
  const { data: doesCurrentUserFollow } = useUser(userId, {
    select: (user) => user.does_current_user_follow
  })

  const handleFollow = useRequiresAccountCallback(() => {
    dispatch(followUser(userId, FollowSource.OVERFLOW))
  }, [dispatch, userId])

  const handleUnfollow = useRequiresAccountCallback(() => {
    dispatch(unfollowUser(userId, FollowSource.OVERFLOW))
  }, [dispatch, userId])

  return (
    <HarmonyFollowButton
      {...rest}
      isFollowing={doesCurrentUserFollow}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
    />
  )
}
