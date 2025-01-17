import { createReducer, ActionType } from 'typesafe-actions'

import { FavoriteType } from '../../../models/Favorite'

import * as actions from './actions'
import { FavoritesPageState } from './types'

type FavoriteActions = ActionType<typeof actions>

const initialState = {
  id: null,
  favoriteType: FavoriteType.TRACK
}

const favoritesPageReducer = createReducer<FavoritesPageState, FavoriteActions>(
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

export default favoritesPageReducer
