import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/user-list/reducer'

import * as actions from './actions'
import { FollowersOwnState, USER_LIST_TAG } from './types'

type FollowersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: USER_LIST_TAG,
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
