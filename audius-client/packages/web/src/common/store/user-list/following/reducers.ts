import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/user-list/reducer'

import * as actions from './actions'
import { FollowingOwnState, USER_LIST_TAG } from './types'

type FollowingActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null
}

const followingPageReducer = createReducer<FollowingOwnState, FollowingActions>(
  initialState,
  {
    [actions.SET_FOLLOWING](state, action) {
      return {
        ...state,
        id: action.id
      }
    }
  }
)

export default combineReducers({
  followingPage: followingPageReducer,
  userList: userListReducer
})
