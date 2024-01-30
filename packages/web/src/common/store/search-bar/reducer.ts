import { Status } from '@audius/common/models'

import { ActionsMap } from 'utils/reducer'

import {
  FETCH_SEARCH_REQUESTED,
  FETCH_SEARCH_SUCCEEDED,
  FETCH_SEARCH_FAILED,
  CLEAR_SEARCH,
  SearchBarActions
} from './actions'
import { SearchBarState } from './types'

const initialState = {
  searchText: '',
  tracks: [],
  users: [],
  playlists: [],
  albums: [],
  status: Status.SUCCESS,
  disregardResponses: false
}

const actionsMap: ActionsMap<SearchBarState> = {
  [FETCH_SEARCH_REQUESTED](state, action) {
    return {
      ...state,
      status: Status.LOADING,
      disregardResponses: false
    }
  },
  [FETCH_SEARCH_SUCCEEDED](state, action) {
    const newState = { ...state }
    newState.status = Status.SUCCESS
    // We might have since deleted the text that
    // we originally queried for;
    if (state.disregardResponses) return { ...newState }

    if (action.results) {
      newState.searchText = action.searchText
      newState.tracks = action.results.tracks ? action.results.tracks : []
      newState.albums = action.results.albums ? action.results.albums : []
      newState.playlists = action.results.playlists
        ? action.results.playlists
        : []
      newState.users = action.results.users ? action.results.users : []
    }
    return newState
  },
  [FETCH_SEARCH_FAILED](state, action) {
    return { ...initialState }
  },
  [CLEAR_SEARCH](state, action) {
    return { ...initialState, disregardResponses: true }
  }
}

export default function search(state = initialState, action: SearchBarActions) {
  const matchingReduceFunction = actionsMap[action.type]
  if (!matchingReduceFunction) return state
  return matchingReduceFunction(state, action)
}
