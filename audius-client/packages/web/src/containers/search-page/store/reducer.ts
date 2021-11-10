import Status from 'common/models/Status'
import {
  FETCH_SEARCH_PAGE_RESULTS,
  FETCH_SEARCH_PAGE_RESULTS_SUCCEEDED,
  FETCH_SEARCH_PAGE_RESULTS_FAILED,
  SearchPageActions,
  FETCH_SEARCH_PAGE_TAGS,
  FETCH_SEARCH_PAGE_TAGS_SUCCEEDED,
  FETCH_SEARCH_PAGE_TAGS_FAILED
} from 'containers/search-page/store/actions'
import { PREFIX } from 'containers/search-page/store/lineups/tracks/actions'
import tracksReducer from 'containers/search-page/store/lineups/tracks/reducer'
import { asLineup } from 'store/lineup/reducer'
import { ActionsMap } from 'utils/reducer'

import { SearchPageState } from './types'

const initialState: SearchPageState = {
  status: Status.SUCCESS,
  searchText: '',
  trackIds: [],
  albumIds: [],
  playlistIds: [],
  artistIds: [],
  tracks: {
    entries: [],
    order: {},
    total: 0,
    deleted: 0,
    status: Status.LOADING,
    hasMore: true,
    inView: false,
    prefix: '',
    page: 0,
    isMetadataLoading: false
  }
}

const actionsMap: ActionsMap<SearchPageState> = {
  [FETCH_SEARCH_PAGE_RESULTS](state, action) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [FETCH_SEARCH_PAGE_RESULTS_SUCCEEDED](state, action) {
    const newState = {
      ...initialState,
      status: Status.SUCCESS
    }

    if (action.results) {
      newState.searchText = action.searchText
      newState.trackIds = action.results.tracks || []
      newState.albumIds = action.results.albums || []
      newState.playlistIds = action.results.playlists || []
      newState.artistIds = action.results.users || []
    }
    return newState
  },
  [FETCH_SEARCH_PAGE_RESULTS_FAILED](state, action) {
    return {
      ...initialState,
      status: Status.ERROR
    }
  },
  [FETCH_SEARCH_PAGE_TAGS](state, action) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [FETCH_SEARCH_PAGE_TAGS_SUCCEEDED](state, action) {
    const newState = {
      ...initialState,
      status: Status.SUCCESS
    }

    if (action.results) {
      newState.searchText = action.tag
      newState.trackIds = action.results.tracks || []
      newState.artistIds = action.results.users || []
      newState.albumIds = []
      newState.playlistIds = []
    }

    return newState
  },
  [FETCH_SEARCH_PAGE_TAGS_FAILED](state, action) {
    return {
      ...initialState,
      status: Status.ERROR
    }
  }
}

const tracksLineupReducer = asLineup(PREFIX, tracksReducer)

function reducer(
  state: SearchPageState = initialState,
  action: SearchPageActions
) {
  const tracks = tracksLineupReducer(state.tracks, action)
  if (tracks !== state.tracks) return { ...state, tracks }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}

export default reducer
