import { CommonState } from '~/store/commonStore'

// Search Results selectors
export const getBaseState = (state: CommonState) => state.pages.searchResults
export const getSearchTracksLineup = (state: CommonState) =>
  getBaseState(state).tracks
