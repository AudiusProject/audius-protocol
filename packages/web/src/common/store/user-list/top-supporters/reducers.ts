import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/user-list/reducer'
import { USER_LIST_TAG } from 'pages/top-supporters-page/sagas'

import * as actions from './actions'
import { TopSupportersOwnState } from './types'

type TopSupportersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: USER_LIST_TAG,
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
