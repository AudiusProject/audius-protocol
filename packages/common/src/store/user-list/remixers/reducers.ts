import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from '../reducer'

import * as actions from './actions'
import { RemixersOwnState, REMIXERS_USER_LIST_TAG } from './types'

type RemixersActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: REMIXERS_USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null,
  trackId: undefined
}

const remixersPageReducer = createReducer<RemixersOwnState, RemixersActions>(
  initialState,
  {
    [actions.SET_REMIXERS](state, action) {
      return {
        ...state,
        id: action.id,
        trackId: action.trackId
      }
    }
  }
)

export default combineReducers({
  remixersPage: remixersPageReducer,
  userList: userListReducer
})
