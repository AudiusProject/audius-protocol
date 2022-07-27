import { LineupState, Track } from '@audius/common'

import { RESET_SUCCEEDED, stripPrefix } from 'common/store/lineup/actions'
import { initialLineupState } from 'common/store/lineup/reducer'

import { PREFIX } from './actions'

export const initialState: LineupState<Track> = {
  ...initialLineupState,
  prefix: PREFIX
}

type ResetSucceeded = typeof RESET_SUCCEEDED

type ResetSucceededAction = {
  type: ResetSucceeded
}

const actionsMap = {
  [RESET_SUCCEEDED](state: typeof initialState, action: ResetSucceededAction) {
    const newState = initialState
    return newState
  }
}

const trendingUndergroundReducer = (
  state = initialState,
  action: ResetSucceededAction
) => {
  const baseActionType = stripPrefix(PREFIX, action.type) as ResetSucceeded
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default trendingUndergroundReducer
