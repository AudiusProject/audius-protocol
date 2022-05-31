import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/user-list/reducer'

import * as actions from './actions'
import { USER_LIST_TAG, MutualsOwnState } from './types'

type MutualsActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null
}

const mutualsPageReducer = createReducer<MutualsOwnState, MutualsActions>(
  initialState,
  {
    [actions.SET_MUTUALS](state, action) {
      return {
        ...state,
        id: action.id
      }
    }
  }
)

export default combineReducers({
  mutualsPage: mutualsPageReducer,
  userList: userListReducer
})
