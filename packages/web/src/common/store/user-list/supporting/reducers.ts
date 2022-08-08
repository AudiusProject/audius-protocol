import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/user-list/reducer'

import * as actions from './actions'
import { SupportingOwnState, USER_LIST_TAG } from './types'

type SupportingActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null
}

const supportingPageReducer = createReducer<
  SupportingOwnState,
  SupportingActions
>(initialState, {
  [actions.SET_SUPPORTING](state, action) {
    return {
      ...state,
      id: action.id
    }
  }
})

export default combineReducers({
  supportingPage: supportingPageReducer,
  userList: userListReducer
})
