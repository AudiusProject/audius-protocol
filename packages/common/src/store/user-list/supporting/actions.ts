import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'

export const SET_SUPPORTING = 'SUPPORTING_USER_PAGE/SET_SUPPORTING'

export const setSupporting = createCustomAction(SET_SUPPORTING, (id: ID) => ({
  id
}))
