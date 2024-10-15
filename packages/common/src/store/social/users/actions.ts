import { Action } from '@reduxjs/toolkit'
import { createCustomAction } from 'typesafe-actions'

import { FollowSource, ShareSource } from '../../../models/Analytics'
import { ID } from '../../../models/Identifiers'

export const FOLLOW_USER = 'SOCIAL/FOLLOW_USER'
export const FOLLOW_USER_SUCCEEDED = 'SOCIAL/FOLLOW_USER_SUCCEEDED'
export const FOLLOW_USER_FAILED = 'SOCIAL/FOLLOW_USER_FAILED'

export const UNFOLLOW_USER = 'SOCIAL/UNFOLLOW_USER'
export const UNFOLLOW_USER_SUCCEEDED = 'SOCIAL/UNFOLLOW_USER_SUCCEEDED'
export const UNFOLLOW_USER_FAILED = 'SOCIAL/UNFOLLOW_USER_FAILED'

export const SUBSCRIBE_USER_FAILED = 'SOCIAL/SUBSCRIBE_USER_FAILED'

export const UNSUBSCRIBE_USER_FAILED = 'SOCIAL/UNSUBSCRIBE_USER_FAILED'

export const SHARE_USER = 'SOCIAL/SHARE_USER'

export const followUser = createCustomAction(
  FOLLOW_USER,
  (
    userId: ID,
    source: FollowSource,
    trackId?: ID, // in case the user is following the artist from a gated track page / modal
    onSuccessActions?: Action[]
  ) => ({ userId, source, trackId, onSuccessActions })
)

export const followUserSucceeded = createCustomAction(
  FOLLOW_USER_SUCCEEDED,
  (userId: ID, onSuccessActions?: Action[]) => ({ userId, onSuccessActions })
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

export const subscribeUserFailed = createCustomAction(
  SUBSCRIBE_USER_FAILED,
  (userId: ID, error: any) => ({ userId, error })
)

export const unsubscribeUserFailed = createCustomAction(
  UNSUBSCRIBE_USER_FAILED,
  (userId: ID, error: any) => ({ userId, error })
)

export const shareUser = createCustomAction(
  SHARE_USER,
  (userId: ID, source: ShareSource) => ({ userId, source })
)
