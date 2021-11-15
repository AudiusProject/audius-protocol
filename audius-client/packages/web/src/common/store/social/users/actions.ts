import { createCustomAction } from 'typesafe-actions'

import { FollowSource, ShareSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'

export const FOLLOW_USER = 'SOCIAL/FOLLOW_USER'
export const FOLLOW_USER_SUCCEEDED = 'SOCIAL/FOLLOW_USER_SUCCEEDED'
export const FOLLOW_USER_FAILED = 'SOCIAL/FOLLOW_USER_FAILED'

export const UNFOLLOW_USER = 'SOCIAL/UNFOLLOW_USER'
export const UNFOLLOW_USER_SUCCEEDED = 'SOCIAL/UNFOLLOW_USER_SUCCEEDED'
export const UNFOLLOW_USER_FAILED = 'SOCIAL/UNFOLLOW_USER_FAILED'

export const SHARE_USER = 'SOCIAL/SHARE_USER'

export const followUser = createCustomAction(
  FOLLOW_USER,
  (userId: ID, source: FollowSource) => ({ userId, source })
)

export const followUserSucceeded = createCustomAction(
  FOLLOW_USER_SUCCEEDED,
  (userId: ID) => ({ userId })
)

export const followUserFailed = createCustomAction(
  FOLLOW_USER_FAILED,
  (userId: ID, error: any) => ({ userId, error })
)

export const unfollowUser = createCustomAction(
  UNFOLLOW_USER,
  (userId: ID, source: FollowSource) => ({ userId, source })
)

export const unfollowUserSucceeded = createCustomAction(
  UNFOLLOW_USER_SUCCEEDED,
  (userId: ID) => ({ userId })
)

export const unfollowUserFailed = createCustomAction(
  UNFOLLOW_USER_FAILED,
  (userId: ID, error: any) => ({ userId, error })
)

export const shareUser = createCustomAction(
  SHARE_USER,
  (userId: ID, source: ShareSource) => ({ userId, source })
)
