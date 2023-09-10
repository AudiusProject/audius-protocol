import { CommonState } from 'store/commonStore'

const getBaseState = (state: CommonState) => state.ui.addToPlaylist

export const getTrackId = (state: CommonState) => getBaseState(state).trackId
export const getTrackTitle = (state: CommonState) =>
  getBaseState(state).trackTitle
export const getTrackIsUnlisted = (state: CommonState) =>
  getBaseState(state).isUnlisted
