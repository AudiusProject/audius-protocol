import { createSelector } from 'reselect'

import { CommonState } from '../commonStore'

import { isSearchItem } from './slice'

const getBaseState = (state: CommonState) => state.search

export const getSearchHistory = (state: CommonState) =>
  getBaseState(state).history.filter((item) => !isSearchItem(item))

export const getV2SearchHistory = createSelector(getSearchHistory, (history) =>
  history.filter(isSearchItem)
)
