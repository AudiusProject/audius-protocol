// @ts-nocheck
// TODO(nkang) - convert to TS
import { asLineup } from 'store/lineup/reducer'
import {
  FETCH_SAVES_SUCCEEDED,
  FETCH_SAVES_FAILED,
  ADD_LOCAL_SAVE,
  REMOVE_LOCAL_SAVE
} from 'store/pages/saved-page/actions'
import tracksReducer from 'store/pages/saved-page/lineups/tracks/reducer'

import { PREFIX as tracksPrefix } from './lineups/tracks/actions'

const initialState = {
  // id => uid
  localSaves: {},
  saves: []
}

const actionsMap = {
  [FETCH_SAVES_SUCCEEDED](state, action) {
    return {
      ...state,
      saves: action.saves
    }
  },
  [FETCH_SAVES_FAILED](state, action) {
    return {
      ...state,
      saves: []
    }
  },
  [ADD_LOCAL_SAVE](state, action) {
    return {
      ...state,
      localSaves: {
        ...state.localSaves,
        [action.trackId]: action.uid
      }
    }
  },
  [REMOVE_LOCAL_SAVE](state, action) {
    const newState = { ...state }
    delete newState.localSaves[action.trackId]
    newState.saves = newState.saves.filter(
      ({ save_item_id: id }) => id !== action.trackId
    )
    return newState
  }
}

const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

const reducer = (state = initialState, action) => {
  const tracks = tracksLineupReducer(state.tracks, action)
  if (tracks !== state.tracks) return { ...state, tracks }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
