import { CommonState } from '../commonStore'

import { isSearchItem } from './slice'
import { SearchItem } from './types'

const getBaseState = (state: CommonState) => state.search

export const getSearchHistory = (state: CommonState): SearchItem[] =>
  getBaseState(state).history.filter((item) =>
    isSearchItem(item)
  ) as SearchItem[]
