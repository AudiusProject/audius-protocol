import { RESET_SUCCEEDED, stripPrefix } from 'store/lineup/actions'
import { initialLineupState } from 'store/lineup/reducer'
import { PREFIX } from 'store/pages/track/lineup/actions'

import { LineupState, Track } from '../../../../models'

export const initialState: LineupState<Track> = {
  ...initialLineupState,
  prefix: PREFIX,
  maxEntries: 6
}

type ResetSucceededAction = {
  type: typeof RESET_SUCCEEDED
}

const actionsMap = {
  [RESET_SUCCEEDED](_state: LineupState<Track>, _action: ResetSucceededAction) {
    const newState = initialState
    return newState
  }
}

const tracks = (state = initialState, action: ResetSucceededAction) => {
  const baseActionType = stripPrefix(
    PREFIX,
    action.type
  ) as typeof RESET_SUCCEEDED
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default tracks
