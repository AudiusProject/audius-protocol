import { AppState } from 'store/types'

export const getLineup = (state: AppState) =>
  state.application.pages.trendingUnderground.trending
