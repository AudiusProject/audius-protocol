import { createReducer } from 'typesafe-actions'

import {
  HANDLE_ERROR,
  HandleErrorAction,
  OPEN_ERROR_PAGE,
  CLOSE_ERROR_PAGE,
  UiErrorCode,
  OpenErrorPageAction,
  CloseErrorPageAction
} from './actions'

export type ErrorState = {
  uiErrorCode: UiErrorCode
  isErrorPageOpen: boolean
}

const initialState: ErrorState = {
  uiErrorCode: UiErrorCode.UNKNOWN,
  isErrorPageOpen: false
}

const reducer = createReducer<
  ErrorState,
  HandleErrorAction | OpenErrorPageAction | CloseErrorPageAction
>(initialState, {
  [HANDLE_ERROR](state, action: HandleErrorAction) {
    return { ...state, uiErrorCode: action.uiErrorCode }
  },
  [OPEN_ERROR_PAGE](state, _: OpenErrorPageAction) {
    return { ...state, isErrorPageOpen: true }
  },
  [CLOSE_ERROR_PAGE](state, _: CloseErrorPageAction) {
    return { ...state, isErrorPageOpen: false }
  }
})

export default reducer
