// @ts-nocheck
// TODO(nkang) - convert to TS
import { asLineup } from 'store/lineup/reducer'
import {
  FETCH_SAVES,
  FETCH_SAVES_REQUESTED,
  FETCH_SAVES_SUCCEEDED,
  FETCH_SAVES_FAILED,
  FETCH_MORE_SAVES_SUCCEEDED,
  FETCH_MORE_SAVES_FAILED,
  ADD_LOCAL_SAVE,
  REMOVE_LOCAL_SAVE
} from 'store/pages/saved-page/actions'
import tracksReducer from 'store/pages/saved-page/lineups/tracks/reducer'

import { PREFIX as tracksPrefix } from './lineups/tracks/actions'

const initialState = {
  // id => uid
  localSaves: {},
  saves: [],
  initialFetch: false
}

const actionsMap = {
  [FETCH_SAVES](state, action) {
    return {
      ...state
    }
  },
  [FETCH_SAVES_REQUESTED](state, action) {
    return {
      ...state,
      initialFetch: true
    }
  },
  [FETCH_SAVES_SUCCEEDED](state, action) {
    return {
      ...state,
      saves: action.saves,
      initialFetch: false
    }
  },
  [FETCH_SAVES_FAILED](state, action) {
    return {
      ...state,
      saves: []
    }
  },
  [FETCH_MORE_SAVES_SUCCEEDED](state, action) {
    const savesCopy = state.saves.slice()
    savesCopy.splice(action.offset, action.saves.length, ...action.saves)

    return {
      ...state,
      saves: savesCopy
    }
  },
  [FETCH_MORE_SAVES_FAILED](state, action) {
    return { ...state }
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
