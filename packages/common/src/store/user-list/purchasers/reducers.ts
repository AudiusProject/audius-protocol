import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from '../reducer'

import * as actions from './actions'
import { PurchasersOwnState, PURCHASERS_USER_LIST_TAG } from './types'

type PurchasersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: PURCHASERS_USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null,
  contentType: undefined,
  contentId: undefined
}

const purchasersPageReducer = createReducer<
  PurchasersOwnState,
  PurchasersActions
>(initialState, {
  [actions.SET_PURCHASERS](state, action) {
    return {
      ...state,
      id: action.id,
      contentType: action.contentType,
      contentId: action.contentId
    }
  }
})

export default combineReducers({
  purchasersPage: purchasersPageReducer,
  userList: userListReducer
})
