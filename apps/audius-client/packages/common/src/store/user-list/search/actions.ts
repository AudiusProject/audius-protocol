import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../../models'

export const SET_SEARCH_QUERY = 'SEARCH_USER_PAGE/SET_SEARCH_QUERY'
export const GET_SEARCH_USERS_ERROR = 'SEARCH_USER_PAGE/GET_SEARCH_USERS_ERROR'

export const setSearchQuery = createCustomAction(
  SET_SEARCH_QUERY,
  (query: string) => ({
    query
  })
)
export const getSearchUsersError = createCustomAction(
  GET_SEARCH_USERS_ERROR,
  (id: ID, error: string) => ({ id, error })
)
