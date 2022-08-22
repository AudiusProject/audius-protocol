import { Status } from '../../../models/index'
import { asLineup } from 'store/lineup/reducer'
import {
  FETCH_SEARCH_PAGE_RESULTS,
  FETCH_SEARCH_PAGE_RESULTS_SUCCEEDED,
  FETCH_SEARCH_PAGE_RESULTS_FAILED,
  SearchPageActions,
  FETCH_SEARCH_PAGE_TAGS,
  FETCH_SEARCH_PAGE_TAGS_SUCCEEDED,
  FETCH_SEARCH_PAGE_TAGS_FAILED,
  FetchSearchPageResultsFailedAction,
  FetchSearchPageResultsSuceededAction,
  FetchSearchPageTagsAction,
  FetchSearchPageTagsSucceededAction,
  FetchSearchPageTagsFailedAction
} from 'store/pages/search-results/actions'
import { PREFIX } from 'store/pages/search-results/lineup/tracks/actions'
import tracksReducer from 'store/pages/search-results/lineup/tracks/reducer'

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
    nullCount: 0,
    status: Status.LOADING,
    hasMore: true,
    inView: false,
    prefix: '',
    page: 0,
    isMetadataLoading: false,
    maxEntries: null,
    containsDeleted: false
  }
}

const actionsMap = {
  [FETCH_SEARCH_PAGE_RESULTS](state: SearchPageState) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [FETCH_SEARCH_PAGE_RESULTS_SUCCEEDED](
    _state: SearchPageState,
    action: FetchSearchPageResultsSuceededAction
  ) {
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
  [FETCH_SEARCH_PAGE_RESULTS_FAILED](
    _state: SearchPageState,
    _action: FetchSearchPageResultsFailedAction
  ) {
    return {
      ...initialState,
      status: Status.ERROR
    }
  },
  [FETCH_SEARCH_PAGE_TAGS](
    state: SearchPageState,
    _action: FetchSearchPageTagsAction
  ) {
    return {
      ...state,
      status: Status.LOADING
    }
  },
  [FETCH_SEARCH_PAGE_TAGS_SUCCEEDED](
    _state: SearchPageState,
    action: FetchSearchPageTagsSucceededAction
  ) {
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
  [FETCH_SEARCH_PAGE_TAGS_FAILED](
    _state: SearchPageState,
    _action: FetchSearchPageTagsFailedAction
  ) {
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
  // @ts-ignore this technically will never hit with actions typed the way they are
  const tracks = tracksLineupReducer(state.tracks, action)
  if (tracks !== state.tracks) return { ...state, tracks }

  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  // @ts-ignore for some reason action is never ts 4.0 may help
  return matchingReduceFunction(state, action as SearchPageActions)
}

export default reducer
