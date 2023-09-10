import { SearchBarState } from './types'

export const getSearch = (state: { searchBar: SearchBarState }) =>
  state.searchBar
export const getSearchBarText = (state: { searchBar: SearchBarState }) =>
  state.searchBar.searchText
export const getSearchBarStatus = (state: { searchBar: SearchBarState }) =>
  state.searchBar.status
