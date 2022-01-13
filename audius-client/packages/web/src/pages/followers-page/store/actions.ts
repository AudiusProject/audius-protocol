import { createCustomAction } from 'typesafe-actions'

import { ID } from 'common/models/Identifiers'

export const SET_FOLOWING = 'FOLLOWING_USER_PAGE/SET_FOLOWING'
export const GET_FOLLOWING_ERROR = 'FOLLOWING_USER_PAGE/GET_FOLLOWING_ERROR'

export const setFollowers = createCustomAction(SET_FOLOWING, (id: ID) => ({
  id
}))
export const getFollowersError = createCustomAction(
  GET_FOLLOWING_ERROR,
  (id: ID, error: string) => ({ id, error })
)
