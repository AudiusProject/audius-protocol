import { AppState } from 'store/types'

export const getUiErrorCode = (state: AppState) => state.error.uiErrorCode

export const getIsErrorPageOpen = (state: AppState) =>
  state.error.isErrorPageOpen
