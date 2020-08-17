import { AppState } from 'store/types'

export const getMobileOverflowModal = (state: AppState) =>
  state.application.ui.mobileOverflowModal
