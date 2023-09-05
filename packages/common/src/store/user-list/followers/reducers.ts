import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from '../reducer'

import * as actions from './actions'
import { FollowersOwnState, FOLLOWERS_USER_LIST_TAG } from './types'

type FollowersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: FOLLOWERS_USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null
}

const followersPageReducer = createReducer<FollowersOwnState, FollowersActions>(
  initialState,
  {
    [actions.SET_FOLLOWERS](state, action) {
      return {
        ...state,
        id: action.id
      }
    }
  }
)

export default combineReducers({
  followersPage: followersPageReducer,
  userList: userListReducer
})
