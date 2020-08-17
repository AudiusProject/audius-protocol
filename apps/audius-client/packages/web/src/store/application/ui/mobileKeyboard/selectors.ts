import { AppState } from 'store/types'

export const getKeyboardVisibility = (state: AppState) =>
  state.application.ui.mobileKeyboard.mobileKeyboardVisible
