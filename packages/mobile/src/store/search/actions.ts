import { SearchResults } from "./types"

export const OPEN = 'SEARCH/OPEN'
export const CLOSE = 'SEARCH/CLOSE'
export const SET_RESULTS = 'SEARCH/SET_RESULTS'
export const UPDATE_QUERY = 'SEARCH/UPDATE_QUERY'
export const SUBMIT_QUERY = 'SEARCH/SUBMIT_QUERY'
export const CLEAR_HISTORY = 'SEARCH/CLEAR_HISTORY'
export const SET_HISTORY = 'SEARCH/SET_HISTORY'
export const FETCH_SEARCH_FAILED = 'SEARCH/FETCH_SEARCH_FAILED'

type OpenAction = {
  type: typeof OPEN,
  reset: boolean
}

type CloseAction = {
  type: typeof CLOSE
}

type UpdateQueryAction = {
  type: typeof UPDATE_QUERY,
  query: string
}

type SubmitQueryAction = {
  type: typeof SUBMIT_QUERY
  query: string
}

type SetResultsAction = {
  type: typeof SET_RESULTS
  query: string
  results: SearchResults
}

type ClearHistoryAction = {
  type: typeof CLEAR_HISTORY
}

type SetSearchHistoryAction = {
  type: typeof SET_HISTORY,
  searchHistory: string[]
}

type FetchSearchFailedAction = {
  type: typeof FETCH_SEARCH_FAILED,
  query: string
}

export type SearchActions =
  | OpenAction
  | CloseAction
  | SetResultsAction
  | ClearHistoryAction
  | SetSearchHistoryAction
  | UpdateQueryAction
  | SubmitQueryAction
  | FetchSearchFailedAction

export const open = (reset: boolean = true): OpenAction => ({
  type: OPEN,
  reset
})

export const close = (): CloseAction => ({
  type: CLOSE
})

export const updateQuery = (query: string): UpdateQueryAction => ({
  type: UPDATE_QUERY,
  query
})

export const submitQuery = (query: string): SubmitQueryAction => ({
  type: SUBMIT_QUERY,
  query
})

export const setResults = ({ query, results }: {
  query: string
  results: any
}): SetResultsAction => ({
  type: SET_RESULTS,
  query,
  results
})

export const clearHistory = (): ClearHistoryAction => ({
  type: CLEAR_HISTORY
})

export const setSearchHistory = (searchHistory: string[]): SetSearchHistoryAction => ({
  type: SET_HISTORY,
  searchHistory
})

export const fetchSearchFailed = ({ query }: { query: string }): FetchSearchFailedAction => ({
  type: FETCH_SEARCH_FAILED,
  query
})
