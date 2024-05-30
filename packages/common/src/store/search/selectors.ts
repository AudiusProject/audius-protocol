import { CommonState } from '../commonStore'

const getBaseState = (state: CommonState) => state.search

export const getSearchHistory = (state: CommonState) =>
  getBaseState(state).history
