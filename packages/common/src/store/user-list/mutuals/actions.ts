import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'

export const SET_MUTUALS = 'MUTUALS_USER_PAGE/SET_MUTUALS'

export const setMutuals = createCustomAction(SET_MUTUALS, (id: ID) => ({
  id
}))
