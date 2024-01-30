import { Status } from '@audius/common/models'
import {} from '@audius/common'

import { ActionsMap } from 'utils/reducer'

import {
  FETCH_SEARCH_REQUESTED,
  FETCH_SEARCH_SUCCEEDED,
  FETCH_SEARCH_FAILED,
  CLEAR_SEARCH,
  SearchBarActions
} from './actions'
import { SearchAiBarState } from './types'

const initialState = {
  searchText: '',
  users: [],
  status: Status.SUCCESS,
  disregardResponses: false
}

const actionsMap: ActionsMap<SearchAiBarState> = {
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
