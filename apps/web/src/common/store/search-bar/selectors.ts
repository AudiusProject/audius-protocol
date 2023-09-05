import SearchBarState from './types'

// TODO(nkang): param should be CommonState once this slice gets moved to @audius/common.
export const getSearch = (state: { searchBar: SearchBarState }) =>
  state.searchBar
export const getSearchBarText = (state: { searchBar: SearchBarState }) =>
  state.searchBar.searchText
export const getSearchBarStatus = (state: { searchBar: SearchBarState }) =>
  state.searchBar.status
