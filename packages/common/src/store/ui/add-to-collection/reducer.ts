import { createReducer, ActionType } from 'typesafe-actions'

import { ID } from '../../../models/Identifiers'

import * as actions from './actions'

type AddToCollectionActions = ActionType<typeof actions>

export type AddToCollectionState = {
  trackId: ID | null
  trackTitle: string | null
  isUnlisted: boolean
  collectionType: 'album' | 'playlist'
}

const initialState = {
  isOpen: false,
  trackId: null,
  trackTitle: null,
  isUnlisted: false,
  collectionType: 'playlist' as const
}

const reducer = createReducer<AddToCollectionState, AddToCollectionActions>(
  initialState,
  {
    [actions.OPEN](state, action) {
      return {
        ...state,
        trackId: action.trackId,
        trackTitle: action.trackTitle,
        isUnlisted: action.isUnlisted ?? false,
        collectionType: action.collectionType
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
