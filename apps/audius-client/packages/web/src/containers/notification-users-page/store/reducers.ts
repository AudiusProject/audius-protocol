import { createReducer, ActionType } from 'typesafe-actions'
import * as actions from './actions'
import { NotificationUsersPageOwnState } from './types'
import { UserListReducerFactory } from 'containers/user-list/store/reducer'
import { USER_LIST_TAG } from '../NotificationUsersPage'
import { combineReducers } from 'redux'

type NotificationUsersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer(USER_LIST_TAG)

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
