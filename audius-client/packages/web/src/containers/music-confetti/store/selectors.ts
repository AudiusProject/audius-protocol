import { AppState } from 'store/types'

export const getIsVisible = (state: AppState) =>
  state.application.ui.musicConfetti.isVisible
