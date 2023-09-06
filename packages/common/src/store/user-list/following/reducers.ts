import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from '../reducer'

import * as actions from './actions'
import { FollowingOwnState, FOLLOWING_USER_LIST_TAG } from './types'

type FollowingActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: FOLLOWING_USER_LIST_TAG,
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
