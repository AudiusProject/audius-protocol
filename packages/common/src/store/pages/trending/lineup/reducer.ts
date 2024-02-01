import { initialLineupState } from '~/store/lineup/reducer'

import { UID, LineupState, Track } from '../../../../models'
import { RESET_SUCCEEDED, stripPrefix } from '../../../lineup/actions'

import {
  PREFIX,
  TRENDING_WEEK_PREFIX,
  TRENDING_MONTH_PREFIX,
  TRENDING_ALL_TIME_PREFIX
} from './actions'

type TrendingLineupState = LineupState<Track>

const initialState: TrendingLineupState = {
  ...initialLineupState,
  dedupe: true,
  prefix: PREFIX
}

type ResetSucceededAction = {
  type: typeof RESET_SUCCEEDED
}

export const makeInitialState = (prefix: string): TrendingLineupState => ({
  ...initialState,
  entryIds: new Set() as Set<UID>,
  prefix
})

const makeActionsMap = (initialState: TrendingLineupState) => {
  return {
    [RESET_SUCCEEDED](
      _state: TrendingLineupState,
      _action: ResetSucceededAction
    ) {
      const newState = initialState
      return newState
    }
  }
}

const makeTrendingReducer = (prefix: string) => {
  const newInitialState = makeInitialState(prefix)
  const newActionsMap = makeActionsMap(newInitialState)

  return (state = newInitialState, action: ResetSucceededAction) => {
    const baseActionType = stripPrefix(
      prefix,
      action.type
    ) as typeof RESET_SUCCEEDED
    const matchingReduceFunction = newActionsMap[baseActionType]
    if (!matchingReduceFunction) return state
    return matchingReduceFunction(state, action)
  }
}

export const trendingWeek = makeTrendingReducer(TRENDING_WEEK_PREFIX)
export const trendingMonth = makeTrendingReducer(TRENDING_MONTH_PREFIX)
export const trendingAllTime = makeTrendingReducer(TRENDING_ALL_TIME_PREFIX)
