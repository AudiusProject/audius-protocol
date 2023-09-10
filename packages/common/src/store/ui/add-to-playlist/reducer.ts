import { createReducer, ActionType } from 'typesafe-actions'

import { ID } from '../../../models/Identifiers'

import * as actions from './actions'

type AddToPlaylistActions = ActionType<typeof actions>

export type AddToPlaylistState = {
  trackId: ID | null
  trackTitle: string | null
  isUnlisted: boolean
}

const initialState = {
  isOpen: false,
  trackId: null,
  trackTitle: null,
  isUnlisted: false
}

const reducer = createReducer<AddToPlaylistState, AddToPlaylistActions>(
  initialState,
  {
    [actions.OPEN](state, action) {
      return {
        ...state,
        trackId: action.trackId,
        trackTitle: action.trackTitle,
        isUnlisted: action.isUnlisted ?? false
      }
    },
    [actions.CLOSE](state, _action) {
      return {
        ...state,
        trackId: null,
        trackTitle: null,
        isUnlisted: false
      }
    }
  }
)

export default reducer
