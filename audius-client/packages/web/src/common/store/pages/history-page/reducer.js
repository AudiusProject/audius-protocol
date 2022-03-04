import { asLineup } from 'common/store/lineup/reducer'

import { PREFIX as tracksPrefix } from './lineups/tracks/actions'
import tracksReducer from './lineups/tracks/reducer'

const initialState = {}

const actionsMap = {}

const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

const reducer = (state = initialState, action) => {
  const tracks = tracksLineupReducer(state.tracks, action)
  if (tracks !== state.tracks) return { ...state, tracks }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
