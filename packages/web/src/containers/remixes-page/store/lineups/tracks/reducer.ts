import { PREFIX } from 'containers/remixes-page/store/lineups/tracks/actions'
import { RESET_SUCCEEDED, stripPrefix } from 'store/lineup/actions'
import { initialLineupState } from 'store/lineup/reducer'

export const initialState = {
  ...initialLineupState,
  containsDeleted: false,
  prefix: PREFIX
}

const actionsMap: { [key in string]: any } = {
  [RESET_SUCCEEDED](state: typeof initialState) {
    const newState = initialState
    return newState
  }
}

const tracks = (state = initialState, action: { type: string }) => {
  const baseActionType = stripPrefix(PREFIX, action.type)
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default tracks
