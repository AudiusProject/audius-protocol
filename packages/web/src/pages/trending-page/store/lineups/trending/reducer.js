import { RESET_SUCCEEDED, stripPrefix } from 'common/store/lineup/actions'
import { initialLineupState } from 'common/store/lineup/reducer'

import {
  PREFIX,
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_ALL_TIME_PREFIX
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
export const trendingAllTime = makeTrendingReducer(TRENDING_ALL_TIME_PREFIX)
