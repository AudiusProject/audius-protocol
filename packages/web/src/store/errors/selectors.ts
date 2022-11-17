import { AppState } from 'store/types'

export const getUiErrorCode = (state: AppState) => state.error.uiErrorCode
