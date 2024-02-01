import { RESET_SUCCEEDED, stripPrefix } from '~/store/lineup/actions'
import { initialLineupState } from '~/store/lineup/reducer'

import { Collection, LineupState } from '../../../../models'

import { PREFIX } from './actions'

export const initialState: LineupState<Collection> = {
  ...initialLineupState,
  prefix: PREFIX,
  // Trending is limited to 30 playlists
  // on the backend, so safe to cap it here
  maxEntries: 30
}

const actionsMap: { [key in string]: any } = {
  [RESET_SUCCEEDED](_state: typeof initialState) {
    const newState = initialState
    return newState
  }
}

const playlistsReducer = (state = initialState, action: { type: string }) => {
  const baseActionType = stripPrefix(PREFIX, action.type)
  const matchingReduceFunction = actionsMap[baseActionType]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default playlistsReducer
