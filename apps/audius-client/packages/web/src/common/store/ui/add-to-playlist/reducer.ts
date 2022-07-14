import { ID } from '@audius/common'
import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'

type AddToPlaylistActions = ActionType<typeof actions>

export type AddToPlaylistState = {
  trackId: ID | null
  trackTitle: string | null
}

const initialState = {
  isOpen: false,
  trackId: null,
  trackTitle: null
}

const reducer = createReducer<AddToPlaylistState, AddToPlaylistActions>(
  initialState,
  {
    [actions.OPEN](state, action) {
      return {
        ...state,
        trackId: action.trackId,
        trackTitle: action.trackTitle
      }
    },
    [actions.CLOSE](state, action) {
      return {
        ...state,
        trackId: null,
        trackTitle: null
      }
    }
  }
)

export default reducer
