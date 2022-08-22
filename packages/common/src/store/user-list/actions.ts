import { createCustomAction } from 'typesafe-actions'

import { ID } from '../../models/index'

export const LOAD_MORE = 'USER_LIST/LOAD_MORE'
export const RESET = 'USER_LIST/RESET'
export const SET_LOADING = 'USER_LIST/SET_LOADING'
export const SET_USER_IDS = 'USER_LIST/SET_USER_IDS'
export const INCREMENT_PAGE = 'USER_LIST/INCREMENT_PAGE'
export const SET_PAGE_SIZE = 'USER_LIST/SET_PAGE_SIZE'

export const loadMore = createCustomAction(LOAD_MORE, (tag: string) => ({
  tag
}))
export const reset = createCustomAction(RESET, (tag: string) => ({ tag }))
export const setLoading = createCustomAction(
  SET_LOADING,
  (tag: string, isLoading: boolean) => ({
    tag,
    isLoading
  })
)
export const setUserIds = createCustomAction(
  SET_USER_IDS,
  (tag, userIds: ID[], hasMore: boolean) => ({
    tag,
    userIds,
    hasMore
  })
)
export const incrementPage = createCustomAction(
  INCREMENT_PAGE,
  (tag: string) => ({ tag })
)
export const setPageSize = createCustomAction(
  SET_PAGE_SIZE,
  (tag: string, pageSize: number) => ({ tag, pageSize })
)
