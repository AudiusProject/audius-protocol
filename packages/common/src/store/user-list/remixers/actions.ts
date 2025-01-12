import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'

export const SET_REMIXERS = 'REMIXERS_USER_PAGE/SET_REMIXERS'

export const setRemixers = createCustomAction(
  SET_REMIXERS,
  (id: ID, trackId: ID) => ({
    id,
    trackId
  })
)
