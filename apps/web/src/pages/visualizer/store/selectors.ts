import { AppState } from 'store/types'

const getBaseState = (state: AppState) => state.application.ui.visualizer

export const getIsVisible = (state: AppState) => getBaseState(state).isVisible
