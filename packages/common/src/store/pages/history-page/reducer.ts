import { Track } from '~/models/Track'
import { LineupActions, asLineup } from '~/store/lineup/reducer'

import { PREFIX as tracksPrefix } from './lineups/tracks/actions'
import tracksReducer, {
  initialState as initialLineupState
} from './lineups/tracks/reducer'

const initialState = {
  tracks: initialLineupState
}

const actionsMap = {}

const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

const reducer = (state = initialState, action: LineupActions<Track>) => {
  const tracks = tracksLineupReducer(state.tracks, action)
  if (tracks !== state.tracks) return { ...state, tracks }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
