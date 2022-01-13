import { RESET_SUCCEEDED, stripPrefix } from 'store/lineup/actions'
import { initialLineupState } from 'store/lineup/reducer'

import {
  PREFIX,
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_YEAR_PREFIX
} from './actions'

const initialState = {
  ...initialLineupState,
  dedupe: true,
  prefix: PREFIX
}

const makeActionsMap = initialState => {
  return {
    [RESET_SUCCEEDED](state, action) {
      const newState = initialState
      return newState
    }
  }
}

const makeTrendingReducer = prefix => {
  const newInitialState = { ...initialState, entryIds: new Set([]), prefix }
  const newActionsMap = makeActionsMap(newInitialState)

  return (state = newInitialState, action) => {
    const baseActionType = stripPrefix(prefix, action.type)
    const matchingReduceFunction = newActionsMap[baseActionType]
    if (!matchingReduceFunction) return state
    return matchingReduceFunction(state, action)
  }
}

export const trendingWeek = makeTrendingReducer(TRENDING_WEEK_PREFIX)
export const trendingMonth = makeTrendingReducer(TRENDING_MONTH_PREFIX)
export const trendingYear = makeTrendingReducer(TRENDING_YEAR_PREFIX)
