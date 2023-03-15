import type { AppState } from '../'

const getBaseState = (state: AppState) => state.search

export const getSearchHistory = (state: AppState) => getBaseState(state).history
