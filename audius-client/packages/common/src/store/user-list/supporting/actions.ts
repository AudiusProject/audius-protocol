import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models'

export const SET_SUPPORTING = 'SUPPORTING_USER_PAGE/SET_SUPPORTING'
export const GET_SUPPORTING_ERROR = 'SUPPORTING_USER_PAGE/GET_SUPPORTING_ERROR'

export const setSupporting = createCustomAction(SET_SUPPORTING, (id: ID) => ({
  id
}))
export const getSupportingError = createCustomAction(
  GET_SUPPORTING_ERROR,
  (id: ID, error: string) => ({ id, error })
)
