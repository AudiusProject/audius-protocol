import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'

export const SET_TOP_SUPPORTERS = 'TOP_SUPPORTERS_USER_PAGE/SET_TOP_SUPPORTERS'

export const setTopSupporters = createCustomAction(
  SET_TOP_SUPPORTERS,
  (id: ID) => ({
    id
  })
)
