import { CommonState } from '~/store/commonStore'

export const getBaseState = (state: CommonState) => state.pages.remixes

export const getLineup = (state: CommonState) => getBaseState(state).tracks

export const getTrackId = (state: CommonState) =>
  getBaseState(state).page.trackId
