import { AppState } from 'store/types'

export const getSearch = (state: AppState) => state.searchAiBar
export const getSearchBarText = (state: AppState) => state.searchBar.searchText
export const getSearchBarStatus = (state: AppState) => state.searchBar.status
export const getSearchResults = (state: AppState) => state.searchAiBar.users
