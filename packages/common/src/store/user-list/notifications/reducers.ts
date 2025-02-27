import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from '~/store/user-list/reducer'

import * as actions from './actions'
import {
  NotificationUsersPageOwnState,
  NOTIFICATIONS_USER_LIST_TAG
} from './types'

type NotificationUsersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: NOTIFICATIONS_USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  notification: null
}

const notificationUsersPageReducer = createReducer<
  NotificationUsersPageOwnState,
  NotificationUsersActions
>(initialState, {
  [actions.SET_NOTIFICATION](state, action) {
    return {
      ...state,
      notification: action.notification
    }
  }
})

export default combineReducers({
  notificationUsersPage: notificationUsersPageReducer,
  userList: userListReducer
})
