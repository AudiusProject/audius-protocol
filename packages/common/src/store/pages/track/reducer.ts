import { Track } from '~/models/Track'
import { LineupActions, asLineup } from '~/store/lineup/reducer'
import tracksReducer, {
  initialState as initialLineupState
} from '~/store/pages/track/lineup/reducer'

import {
  SET_TRACK_ID,
  SET_TRACK_PERMALINK,
  RESET,
  SET_TRACK_RANK,
  SET_TRACK_TRENDING_RANKS,
  SetTrackIdAction,
  SetTrackPermalinkAction,
  SetTrackRankAction,
  SetTrackTrendingRanksAction,
  ResetAction,
  TrackPageAction
} from './actions'
import { PREFIX as tracksPrefix } from './lineup/actions'
import { TrackPageState } from './types'

const initialState: TrackPageState = {
  trackId: null,
  trackPermalink: null,
  rank: {
    week: null,
    month: null,
    year: null,
    allTime: null
  },
  trendingTrackRanks: {
    week: null,
    month: null,
    year: null,
    allTime: null
  },
  tracks: initialLineupState
}

const actionsMap = {
  [SET_TRACK_ID](state: TrackPageState, action: SetTrackIdAction) {
    return {
      ...state,
      trackId: action.trackId
    }
  },
  [SET_TRACK_PERMALINK](
    state: TrackPageState,
    action: SetTrackPermalinkAction
  ) {
    return {
      ...state,
      trackPermalink: action.permalink
    }
  },
  [SET_TRACK_RANK](state: TrackPageState, action: SetTrackRankAction) {
    return {
      ...state,
      rank: {
        ...state.rank,
        [action.duration]: action.rank
      }
    }
  },
  [SET_TRACK_TRENDING_RANKS](
    state: TrackPageState,
    action: SetTrackTrendingRanksAction
  ) {
    return {
      ...state,
      trendingTrackRanks: {
        ...state.trendingTrackRanks,
        ...action.trendingTrackRanks
      }
    }
  },
  [RESET](state: TrackPageState, action: ResetAction) {
    return {
      ...state,
      ...initialState,
      // @ts-ignore - Massaging the old reset action for track page to work with the lineup reducer
      // Probably should use the lineup reset action instead
      tracks: tracksLineupReducer(undefined, action)
    }
  }
}

const tracksLineupReducer = asLineup(tracksPrefix, tracksReducer)

const reducer = (
  state: TrackPageState,
  action: TrackPageAction | LineupActions<Track>
) => {
  if (!state) {
    state = initialState
  }

  const tracks = tracksLineupReducer(
    state.tracks,
    action as LineupActions<Track>
  )
  if (tracks !== state.tracks) return { ...state, tracks }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action as TrackPageAction)
}

export default reducer
