import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from '../reducer'

import * as actions from './actions'
import { TopSupportersOwnState, TOP_SUPPORTERS_USER_LIST_TAG } from './types'

type TopSupportersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: TOP_SUPPORTERS_USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null
}

const topSupportersPageReducer = createReducer<
  TopSupportersOwnState,
  TopSupportersActions
>(initialState, {
  [actions.SET_TOP_SUPPORTERS](state, action) {
    return {
      ...state,
      id: action.id
    }
  }
})

export default combineReducers({
  topSupportersPage: topSupportersPageReducer,
  userList: userListReducer
})
