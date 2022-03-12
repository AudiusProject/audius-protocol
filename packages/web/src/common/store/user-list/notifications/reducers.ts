import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/user-list/reducer'
import { USER_LIST_TAG } from 'pages/notification-users-page/NotificationUsersPage'

import * as actions from './actions'
import { NotificationUsersPageOwnState } from './types'

type NotificationUsersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer(USER_LIST_TAG, 15)

const initialState = {
  id: null
}

const notificationUsersPageReducer = createReducer<
  NotificationUsersPageOwnState,
  NotificationUsersActions
>(initialState, {
  [actions.SET_NOTIFICATION_ID](state, action) {
    return {
      ...state,
      id: action.id
    }
  }
})

export default combineReducers({
  notificationUsersPage: notificationUsersPageReducer,
  userList: userListReducer
})
