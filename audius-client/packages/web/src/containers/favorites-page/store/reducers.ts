import { createReducer, ActionType } from 'typesafe-actions'
import * as actions from './actions'
import { FavoritesOwnState } from './types'
import { UserListReducerFactory } from 'containers/user-list/store/reducer'
import { USER_LIST_TAG } from '../FavoritesPage'
import { combineReducers } from 'redux'
import { FavoriteType } from 'models/Favorite'

type FavoriteActions = ActionType<typeof actions>

const userListReducer = UserListReducerFactory.createReducer(USER_LIST_TAG)

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
