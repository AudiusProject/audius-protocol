import { createReducer, ActionType } from 'typesafe-actions'

import * as actions from './actions'

type BrowserPushPermissioActions = ActionType<typeof actions>

export type BrowserPushPermissionConfirmationModalState = {
  isOpen: boolean
}

const initialState = {
  isOpen: false
}

const reducer = createReducer<
  BrowserPushPermissionConfirmationModalState,
  BrowserPushPermissioActions
>(initialState, {
  [actions.OPEN](state, action) {
    return {
      ...state,
      isOpen: true
    }
  },
  [actions.CLOSE](state, action) {
    return {
      ...state,
      isOpen: false
    }
  }
})

export default reducer
