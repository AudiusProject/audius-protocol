import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models/Identifiers'

export const SET_FOLLOWERS = 'FOLLOWERS_USER_PAGE/SET_FOLLOWERS'
export const GET_FOLLOWERS_ERROR = 'FOLLOWERS_USER_PAGE/GET_FOLLOWERS_ERROR'

export const setFollowers = createCustomAction(SET_FOLLOWERS, (id: ID) => ({
  id
}))
export const getFollowersError = createCustomAction(
  GET_FOLLOWERS_ERROR,
  (id: ID, error: string) => ({ id, error })
)
