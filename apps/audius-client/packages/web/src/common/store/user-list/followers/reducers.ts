import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/user-list/reducer'

import { USER_LIST_TAG } from '../../../../pages/followers-page/sagas'

import * as actions from './actions'
import { FollowersOwnState } from './types'

type FollowersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer(USER_LIST_TAG, 15)

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
