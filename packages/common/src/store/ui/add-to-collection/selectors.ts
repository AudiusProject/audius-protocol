import { CommonState } from 'store/commonStore'

const getBaseState = (state: CommonState) => state.ui.addToCollection

export const getCollectionType = (state: CommonState) =>
  getBaseState(state).collectionType
export const getTrackId = (state: CommonState) => getBaseState(state).trackId
export const getTrackTitle = (state: CommonState) =>
  getBaseState(state).trackTitle
export const getTrackIsUnlisted = (state: CommonState) =>
  getBaseState(state).isUnlisted
