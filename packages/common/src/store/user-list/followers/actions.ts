import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'

export const SET_FOLLOWERS = 'FOLLOWERS_USER_PAGE/SET_FOLLOWERS'

export const setFollowers = createCustomAction(SET_FOLLOWERS, (id: ID) => ({
  id
}))
