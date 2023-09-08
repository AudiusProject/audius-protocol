import { createReducer } from 'typesafe-actions'

import { HANDLE_ERROR, HandleErrorAction, UiErrorCode } from './actions'

export type ErrorState = {
  uiErrorCode: UiErrorCode
}

const initialState: ErrorState = {
  uiErrorCode: UiErrorCode.UNKNOWN
}

export default createReducer<ErrorState, HandleErrorAction>(initialState, {
  [HANDLE_ERROR](state, action: HandleErrorAction) {
    return { ...state, uiErrorCode: action.uiErrorCode }
  }
})
