import { SsrPageProps } from '@audius/common/models'
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

const buildInitialState = (ssrPageProps?: SsrPageProps) => {
  // If we have preloaded data from the server, populate the initial
  // page state with it
  if (ssrPageProps?.error) {
    return {
      ...initialState,
      ...ssrPageProps.error
    }
  }
  return initialState
}

const reducer = (ssrPageProps?: SsrPageProps) =>
  createReducer<ErrorState, HandleErrorAction | OpenErrorPageAction>(
    buildInitialState(ssrPageProps),
    {
      [HANDLE_ERROR](state, action: HandleErrorAction) {
        return { ...state, uiErrorCode: action.uiErrorCode }
      },
      [OPEN_ERROR_PAGE](state, _: OpenErrorPageAction) {
        return { ...state, isErrorPageOpen: true }
      }
    }
  )

export default reducer
