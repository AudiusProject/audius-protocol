import { AppState } from '../'

const getBaseState = (state: AppState) => state.search

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
export const getSearchQuery = (state: AppState) => getBaseState(state).query
export const getSearchHistory = (state: AppState) => getBaseState(state).history
export const getSearchResults = (state: AppState) => getBaseState(state).results
export const getSearchResultQuery = (state: AppState) =>
  getBaseState(state).resultQuery
