export const FETCH_SEARCH = 'SEARCH_BAR/FETCH_SEARCH'
export const FETCH_SEARCH_REQUESTED = 'SEARCH_BAR/FETCH_SEARCH_REQUESTED'
export const FETCH_SEARCH_SUCCEEDED = 'SEARCH_BAR/FETCH_SEARCH_SUCCEEDED'
export const FETCH_SEARCH_FAILED = 'SEARCH_BAR/FETCH_SEARCH_FAILED'

export const CANCEL_FETCH_SEARCH = 'SEARCH_BAR/CANCEL_FETCH_SEARCH'
export const CLEAR_SEARCH = 'SEARCH_BAR/CLEAR_SEARCH'
export const OPEN_MOBILE_SEARCH_BAR = 'SEARCH_BAR/OPEN_MOBILE_SEARCH_BAR'

export type FetchSearchAction = {
  type: typeof FETCH_SEARCH
  searchText: string
}
export type FetchSearchRequestedAction = {
  type: typeof FETCH_SEARCH_REQUESTED
  searchText: string
}
export type FetchSearchSucceededAction = {
  type: typeof FETCH_SEARCH_SUCCEEDED
  searchText: string
  results: any
}
export type FetchSearchFailedAction = {
  type: typeof FETCH_SEARCH_FAILED
  searchText: string
}
export type CancelFetchSearchAction = { type: typeof CANCEL_FETCH_SEARCH }
export type ClearSearchAction = { type: typeof CLEAR_SEARCH }
export type OpenMobileSearchBar = { type: typeof OPEN_MOBILE_SEARCH_BAR }
export type SearchBarActions =
  | FetchSearchAction
  | FetchSearchRequestedAction
  | FetchSearchSucceededAction
  | FetchSearchFailedAction
  | CancelFetchSearchAction
  | ClearSearchAction
  | OpenMobileSearchBar

export function openMobileSearchBar(): SearchBarActions {
  return { type: OPEN_MOBILE_SEARCH_BAR }
}

export function fetchSearch(searchText: string): SearchBarActions {
  return { type: FETCH_SEARCH, searchText }
}
export function fetchSearchRequested(searchText: string): SearchBarActions {
  return { type: FETCH_SEARCH_REQUESTED, searchText }
}
export function fetchSearchSucceeded(
  results: any,
  searchText: string
): SearchBarActions {
  return {
    type: FETCH_SEARCH_SUCCEEDED,
    results,
    searchText
  }
}
export function fetchSearchFailed(searchText: string): SearchBarActions {
  return { type: FETCH_SEARCH_FAILED, searchText }
}

export function cancelFetchSearch(): SearchBarActions {
  return { type: CANCEL_FETCH_SEARCH }
}

export function clearSearch(): SearchBarActions {
  return { type: CLEAR_SEARCH }
}
