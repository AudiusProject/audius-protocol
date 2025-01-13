import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'

export const SET_PURCHASERS = 'PURCHASERS_USER_PAGE/SET_PURCHASERS'

export const setPurchasers = createCustomAction(SET_PURCHASERS, (id: ID) => ({
  id
}))
