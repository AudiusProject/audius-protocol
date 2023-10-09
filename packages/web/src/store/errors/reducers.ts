import { createReducer } from 'typesafe-actions'

import {
  HANDLE_ERROR,
  HandleErrorAction,
  OPEN_ERROR_PAGE,
  UiErrorCode,
  OpenErrorPageAction
} from './actions'

export type ErrorState = {
  uiErrorCode: UiErrorCode
  isErrorPageOpen: boolean
}

const initialState: ErrorState = {
  uiErrorCode: UiErrorCode.UNKNOWN,
  isErrorPageOpen: false
}

export default createReducer<
  ErrorState,
  HandleErrorAction | OpenErrorPageAction
>(initialState, {
  [HANDLE_ERROR](state, action: HandleErrorAction) {
    return { ...state, uiErrorCode: action.uiErrorCode }
  },
  [OPEN_ERROR_PAGE](state, _: OpenErrorPageAction) {
    return { ...state, isErrorPageOpen: true }
  }
})
