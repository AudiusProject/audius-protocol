import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models'

export const SET_FOLLOWING = 'FOLLOWING_USER_PAGE/SET_FOLLOWING'
export const GET_FOLLOWING_ERROR = 'FOLLOWING_USER_PAGE/GET_FOLLOWING_ERROR'

export const setFollowing = createCustomAction(SET_FOLLOWING, (id: ID) => ({
  id
}))

export const getFollowingError = createCustomAction(
  GET_FOLLOWING_ERROR,
  (id: ID, error: string) => ({ id, error })
)
