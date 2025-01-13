import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { RelatedArtistsPageState } from './types'

type RelatedArtistsActions = ActionType<typeof actions>

const initialState = {
  id: null
}

const relatedArtistsReducer = createReducer<
  RelatedArtistsPageState,
  RelatedArtistsActions
>(initialState, {
  [actions.SET_RELATED_ARTISTS](state, action) {
    return {
      ...state,
      id: action.id
    }
  }
})

export default relatedArtistsReducer
