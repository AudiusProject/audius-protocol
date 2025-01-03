import { AppState } from 'store/types'

export const getSearch = (state: AppState) => state.searchAiBar
export const getSearchResults = (state: AppState) => state.searchAiBar.users
