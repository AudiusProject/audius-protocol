import { CommonState } from 'common/store'

export const getLineup = (state: CommonState) =>
  state.pages.trendingPlaylists.trending
