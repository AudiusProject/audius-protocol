import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models/index'

export const SET_TOP_SUPPORTERS = 'TOP_SUPPORTERS_USER_PAGE/SET_TOP_SUPPORTERS'
export const GET_TOP_SUPPORTERS_ERROR =
  'TOP_SUPPORTERS_USER_PAGE/GET_TOP_SUPPORTERS_ERROR'

export const setTopSupporters = createCustomAction(
  SET_TOP_SUPPORTERS,
  (id: ID) => ({
    id
  })
)
export const getTopSupportersError = createCustomAction(
  GET_TOP_SUPPORTERS_ERROR,
  (id: ID, error: string) => ({ id, error })
)
