import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/user-list/reducer'

import { USER_LIST_TAG } from '../../../../pages/following-page/sagas'

import * as actions from './actions'
import { FollowingOwnState } from './types'

type FollowingActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer(USER_LIST_TAG, 15)

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
