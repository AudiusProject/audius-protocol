import { FavoriteType } from '@audius/common'
import { combineReducers } from 'redux'
import { createReducer, ActionType } from 'typesafe-actions'

import { UserListReducerFactory } from 'common/store/user-list/reducer'

import { USER_LIST_TAG } from '../../../../pages/favorites-page/sagas'

import * as actions from './actions'
import { FavoritesOwnState } from './types'

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
    [actions.SET_FAVORITE](state, action) {
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
