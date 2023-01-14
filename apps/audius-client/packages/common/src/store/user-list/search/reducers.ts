import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from '../reducer'

import * as actions from './actions'
import { SearchOwnState, SEARCH_USER_LIST_TAG as USER_LIST_TAG } from './types'

type SearchActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  query: ''
}

const searchPageReducer = createReducer<SearchOwnState, SearchActions>(
  initialState,
  {
    [actions.SET_SEARCH_QUERY](
      state: SearchOwnState,
      action: ReturnType<typeof actions.setSearchQuery>
    ) {
      return {
        ...state,
        query: action.query
      }
    }
  }
)

export default combineReducers({
  searchPage: searchPageReducer,
  userList: userListReducer
})
