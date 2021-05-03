import { Status } from '../../types/status'
import {
  SearchActions,
  OPEN,
  CLOSE,
  UPDATE_QUERY,
  SUBMIT_QUERY,
  SET_RESULTS,
  CLEAR_HISTORY,
  SET_HISTORY,
  FETCH_SEARCH_FAILED
} from './actions'
import { SearchResults } from './types'

export type SearchState = {
  isOpen: boolean
  status: Status
  query: string
  resultQuery: string
  results: SearchResults
  history: string[]
}

const initialState = {
  isOpen: false,
  query: '',
  resultQuery: '',
  results: {
    users: [],
    tracks: [],
    playlists: [],
    albums: []
  },
  status: Status.LOADING,
  history: []
}

const reducer = (state: SearchState = initialState, action: SearchActions) => {
  switch (action.type) {
    case OPEN:
      if (action.reset) {
        return {
          ...initialState,
          history: state.history,
          isOpen: true
        }
      }
      return {
        ...state,
        isOpen: true
      }
    case CLOSE:
      return {
        ...state,
        isOpen: false
      }
    case UPDATE_QUERY: {
      const updatedState = {
        ...state,
        query: action.query
      }
      if (action.query === '') {
        updatedState.results = {
          ...initialState.results
        }
        updatedState.resultQuery = ''
      }
      return updatedState
    }
    case SUBMIT_QUERY: {
      return {
        ...state,
        query: action.query
      }
    }
    case SET_RESULTS:
      return {
        ...state,
        results: action.results,
        resultQuery: action.query
      }
    case CLEAR_HISTORY:
      return {
        ...state,
        history: []
      }
    case SET_HISTORY:
      return {
        ...state,
        history: action.searchHistory
      }
    case FETCH_SEARCH_FAILED:
      return {
        ...state,
        results: initialState.results,
        resultQuery: action.query
      }
    default:
      return state
  }
}

export default reducer
