import { lineupActions, lineupReducer } from '@audius/common/store'
import {} from '@audius/common'
import { LineupState, Track } from '@audius/common/models'

import { PREFIX } from 'pages/deleted-page/store/lineups/more-by/actions'
const { initialLineupState } = lineupReducer
const { RESET_SUCCEEDED, stripPrefix } = lineupActions

export const initialState: LineupState<Track> = {
  ...initialLineupState,
  prefix: PREFIX
}

const actionsMap: { [key in string]: any } = {
  [RESET_SUCCEEDED](state: typeof initialState) {
    const newState = initialState
    return newState
  }
}

const moreBy = (state = initialState, action: { type: string }) => {
  const baseActionType = stripPrefix(PREFIX, action.type)
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default moreBy
