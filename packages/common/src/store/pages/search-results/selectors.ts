import { CommonState } from '~/store/commonStore'

// Search Results selectors
export const getBaseState = (state: CommonState) => state.pages.searchResults
export const getSearchText = (state: CommonState) =>
  getBaseState(state).searchText
export const getIsTagSearch = (state: CommonState) =>
  getBaseState(state).isTagSearch
export const getSearchTracksLineup = (state: CommonState) =>
  getBaseState(state).tracks
export const getSearchResults = (state: CommonState) => getBaseState(state)
export const getSearchStatus = (state: CommonState) =>
  getBaseState(state).status
export const getSearchResultsPageTracks = (state: CommonState) =>
  getBaseState(state).trackIds || []
