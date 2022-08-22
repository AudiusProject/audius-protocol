import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { FavoriteType } from '../../../models/Favorite'
import { UserListReducerFactory } from '../reducer'

import * as actions from './actions'
import {
  FavoritesOwnState,
  FAVORITES_USER_LIST_TAG as USER_LIST_TAG
} from './types'

type FavoriteActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer({
  tag: USER_LIST_TAG,
  pageSize: 15
})

const initialState = {
  id: null,
  favoriteType: FavoriteType.TRACK
}

const favoritesPageReducer = createReducer<FavoritesOwnState, FavoriteActions>(
  initialState,
  {
    [actions.SET_FAVORITE](state: any, action: any) {
      return {
        ...state,
        id: action.id,
        favoriteType: action.favoriteType
      }
    }
  }
)

export default combineReducers({
  favoritesPage: favoritesPageReducer,
  userList: userListReducer
})
