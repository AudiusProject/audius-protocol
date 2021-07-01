import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'containers/user-list/store/reducer'

import { USER_LIST_TAG } from '../FollowingPage'

import * as actions from './actions'
import { FollowingOwnState } from './types'

type FollowingActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer(USER_LIST_TAG)

const initialState = {
  id: null
}

const followingPageReducer = createReducer<FollowingOwnState, FollowingActions>(
  initialState,
  {
    [actions.SET_FOLOWING](state, action) {
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
