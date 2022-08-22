import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models'

export const SET_MUTUALS = 'MUTUAL_USERS_PAGE/SET_MUTUALS'
export const GET_MUTUALS_ERROR = 'MUTUAL_USERS_PAGE/GET_MUTUALS_ERROR'

export const setMutuals = createCustomAction(SET_MUTUALS, (id: ID) => ({
  id
}))

export const getMutualsError = createCustomAction(
  GET_MUTUALS_ERROR,
  (id: ID, error: string) => ({ id, error })
)
