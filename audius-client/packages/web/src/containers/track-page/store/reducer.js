import tracksReducer from 'containers/track-page/store/lineups/tracks/reducer'
import { asLineup } from 'store/lineup/reducer'

import {
  SET_TRACK_ID,
  SET_TRACK_PERMALINK,
  RESET,
  SET_TRACK_RANK,
  SET_TRACK_TRENDING_RANKS
} from './actions'
import { PREFIX as tracksPrefix } from './lineups/tracks/actions'

const initialState = {
  trackId: null,
  rank: {
    week: null,
    month: null,
    year: null
  },
  trendingTrackRanks: {
    week: null,
    month: null,
    year: null
  }
}

const actionsMap = {
  [SET_TRACK_ID](state, action) {
    return {
      ...state,
      trackId: action.trackId
    }
  },
  [SET_TRACK_PERMALINK](state, action) {
    return {
      ...state,
      trackPermalink: action.permalink
    }
  },
  [SET_TRACK_RANK](state, action) {
    return {
      ...state,
      rank: {
        ...state.rank,
        [action.duration]: action.rank
      }
    }
  },
  [SET_TRACK_TRENDING_RANKS](state, action) {
    return {
      ...state,
      trendingTrackRanks: {
        ...state.trendingTrackRanks,
        ...action.trendingTrackRanks
      }
    }
  },
  [RESET](state, action) {
    return {
      ...state,
      ...initialState
    }
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
