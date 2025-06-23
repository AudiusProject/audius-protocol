import { createSelector } from 'reselect'

import { CommonState } from '../commonStore'

import { isSearchItem } from './slice'
import { SearchItem } from './types'

const getBaseState = (state: CommonState) => state.search

export const getSearchHistory = createSelector(
  [getBaseState],
  (searchState): SearchItem[] =>
    searchState.history.filter((item) => isSearchItem(item)) as SearchItem[]
)
