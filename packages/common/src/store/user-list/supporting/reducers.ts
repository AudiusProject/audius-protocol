import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from '../reducer'

import * as actions from './actions'
import { SupportingOwnState, SUPPORTING_USER_LIST_TAG } from './types'

type SupportingActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: SUPPORTING_USER_LIST_TAG,
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
