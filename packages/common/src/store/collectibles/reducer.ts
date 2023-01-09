import { createReducer, ActionType } from 'typesafe-actions'

import { Collectible, ID } from 'models'

import * as actions from './actions'
import { UPDATE_USER_COLLECTIBLES } from './actions'

type CollectiblesActions = ActionType<typeof actions>

type CollectiblesState = {
  collectibles: { [id: ID]: Collectible[] }
}

const initialState = {
  collectibles: {}
}

const collectiblesReducer = createReducer<
  CollectiblesState,
  CollectiblesActions
>(initialState, {
  [UPDATE_USER_COLLECTIBLES](state, action) {
    return {
      ...state,
      collectibles: {
        ...state.collectibles,
        [action.userId]: action.userCollectibles
      }
    }
  }
})

export default collectiblesReducer
