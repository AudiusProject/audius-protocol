import { CommonState } from 'common/store'

export const getHistory = (state: CommonState) => state.pages.historyPage
export const getHistoryTracksLineup = (state: CommonState) =>
  state.pages.historyPage.tracks
