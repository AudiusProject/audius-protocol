import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { DeletePlaylistConfirmationModalState } from './types'

type DeletePlaylistModalActions = ActionType<typeof actions>

const initialState = {
  playlistId: null,
  isOpen: false
}

const deletePlaylistConfirmationModalReducer = createReducer<
  DeletePlaylistConfirmationModalState,
  DeletePlaylistModalActions
>(initialState, {
  [actions.SET_OPEN](state, action) {
    return {
      ...state,
      playlistId: action.id,
      isOpen: true
    }
  },
  [actions.SET_CLOSED](state) {
    return {
      ...state,
      playlistId: null,
      isOpen: false
    }
  }
})

export default deletePlaylistConfirmationModalReducer
