import { Collection } from 'models/Collection'
import { LineupState } from 'models/Lineup'
import { RESET_SUCCEEDED, stripPrefix } from 'store/lineup/actions'
import { initialLineupState } from 'store/lineup/reducer'
import { PREFIX } from 'store/pages/collection/lineup/actions'

export const initialState = {
  ...initialLineupState,
  prefix: PREFIX
}

type ResetSucceededAction = {
  type: typeof RESET_SUCCEEDED
}

const actionsMap = {
  [RESET_SUCCEEDED](
    _state: LineupState<Collection>,
    _action: ResetSucceededAction
  ) {
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
