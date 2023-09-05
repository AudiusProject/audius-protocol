export const UPDATE_QUERY = 'SEARCH/UPDATE_QUERY'
export const CLEAR_HISTORY = 'SEARCH/CLEAR_HISTORY'
export const SET_HISTORY = 'SEARCH/SET_HISTORY'

type UpdateQueryAction = {
  type: typeof UPDATE_QUERY
  query: string
}

type ClearHistoryAction = {
  type: typeof CLEAR_HISTORY
}

type SetSearchHistoryAction = {
  type: typeof SET_HISTORY
  searchHistory: string[]
}

export type SearchActions =
  | ClearHistoryAction
  | SetSearchHistoryAction
  | UpdateQueryAction

export const updateQuery = (query: string): UpdateQueryAction => ({
  type: UPDATE_QUERY,
  query
})

export const clearHistory = (): ClearHistoryAction => ({
  type: CLEAR_HISTORY
})

export const setSearchHistory = (
  searchHistory: string[]
): SetSearchHistoryAction => ({
  type: SET_HISTORY,
  searchHistory
})
