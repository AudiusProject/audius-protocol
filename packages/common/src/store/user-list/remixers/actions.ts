import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models'

export const SET_REMIXERS = 'REMIXERS_USER_PAGE/SET_REMIXERS'
export const GET_REMIXERS_ERROR = 'REMIXERS_USER_PAGE/GET_REMIXERS_ERROR'

export const setRemixers = createCustomAction(
  SET_REMIXERS,
  (id: ID, trackId?: ID) => ({
    id,
    trackId
  })
)
export const getRemixersError = createCustomAction(
  GET_REMIXERS_ERROR,
  (id: ID, error: string, trackId?: ID) => ({
    id,
    trackId,
    error
  })
)
