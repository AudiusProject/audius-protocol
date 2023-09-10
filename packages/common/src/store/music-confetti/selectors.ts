import { CommonState } from '../commonStore'

export const getIsVisible = (state: CommonState) =>
  state.ui.musicConfetti.isVisible
