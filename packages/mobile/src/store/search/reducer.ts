import type { SearchActions } from './actions'
import { CLEAR_HISTORY, SET_HISTORY, UPDATE_QUERY } from './actions'

export type SearchState = {
  query: string
  history: string[]
}

const initialState = {
  query: '',
  history: []
}

const reducer = (state: SearchState = initialState, action: SearchActions) => {
  switch (action.type) {
    case UPDATE_QUERY: {
      const updatedState = {
        ...state,
        query: action.query
      }
      return updatedState
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
    default:
      return state
  }
}

export default reducer
