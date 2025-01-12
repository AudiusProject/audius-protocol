import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'

export const SET_FOLLOWING = 'FOLLOWING_USER_PAGE/SET_FOLLOWING'

export const setFollowing = createCustomAction(SET_FOLLOWING, (id: ID) => ({
  id
}))
