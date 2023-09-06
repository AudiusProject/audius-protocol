// @ts-nocheck
// TODO(nkang) - convert to TS
import { asLineup } from 'store/lineup/reducer'
import {
  FETCH_SAVES,
  FETCH_SAVES_REQUESTED,
  FETCH_SAVES_SUCCEEDED,
  FETCH_SAVES_FAILED,
  FETCH_MORE_SAVES,
  FETCH_MORE_SAVES_SUCCEEDED,
  FETCH_MORE_SAVES_FAILED,
  ADD_LOCAL_SAVE,
  REMOVE_LOCAL_SAVE,
  END_FETCHING
} from 'store/pages/saved-page/actions'
import tracksReducer, {
  initialState as initialLineupState
} from 'store/pages/saved-page/lineups/tracks/reducer'
import { signOut } from 'store/sign-out/slice'

import { PREFIX as tracksPrefix } from './lineups/tracks/actions'

const initialState = {
  // id => uid
  localSaves: {},
  saves: [],
  initialFetch: false,
  hasReachedEnd: false,
  fetchingMore: false,
  tracks: initialLineupState
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
      initialFetch: true,
      hasReachedEnd: false
    }
  },
  [FETCH_SAVES_SUCCEEDED](state, action) {
    return {
      ...state,
      saves: action.saves,
      initialFetch: false
    }
  },
  [FETCH_MORE_SAVES](state, action) {
    return {
      ...state,
      fetchingMore: true
    }
  },
  [FETCH_SAVES_FAILED](state, action) {
    return {
      ...state,
      fetchingMore: false,
      saves: []
    }
  },
  [FETCH_MORE_SAVES_SUCCEEDED](state, action) {
    const savesCopy = state.saves.slice()
    savesCopy.splice(action.offset, action.saves.length, ...action.saves)

    return {
      ...state,
      fetchingMore: false,
      saves: savesCopy
    }
  },
  [FETCH_MORE_SAVES_FAILED](state, action) {
    return { ...state }
  },
  [END_FETCHING](state, action) {
    const savesCopy = state.saves.slice(0, action.endIndex)
    return {
      ...state,
      saves: savesCopy,
      hasReachedEnd: true
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
  },
  [signOut.type](state) {
    return initialState
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
