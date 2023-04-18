import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from '../reducer'

import * as actions from './actions'
import { RelatedArtistsOwnState, RELATED_ARTISTS_USER_LIST_TAG } from './types'

type RelatedArtistsActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: RELATED_ARTISTS_USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null
}

const relatedArtistsPageReducer = createReducer<
  RelatedArtistsOwnState,
  RelatedArtistsActions
>(initialState, {
  [actions.SET_RELATED_ARTISTS](state, action) {
    return {
      ...state,
      id: action.id
    }
  }
})

export default combineReducers({
  relatedArtistsPage: relatedArtistsPageReducer,
  userList: userListReducer
})
