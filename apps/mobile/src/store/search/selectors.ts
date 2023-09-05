import type { AppState } from '../'

const getBaseState = (state: AppState) => state.search

export const getSearchQuery = (state: AppState) => getBaseState(state).query
export const getSearchHistory = (state: AppState) => getBaseState(state).history
