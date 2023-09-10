import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'
import { UnfollowConfirmationModalState } from './types'

type UnfollowModalActions = ActionType<typeof actions>

const initialState = {
  userId: null,
  isOpen: false
}

const unfollowConfirmationModalReducer = createReducer<
  UnfollowConfirmationModalState,
  UnfollowModalActions
>(initialState, {
  [actions.SET_OPEN](state, action) {
    return {
      ...state,
      userId: action.id,
      isOpen: true
    }
  },
  [actions.SET_CLOSED](state) {
    return {
      ...state,
      userId: null,
      isOpen: false
    }
  }
})

export default unfollowConfirmationModalReducer
