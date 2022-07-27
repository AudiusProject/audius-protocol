import type { AppState } from 'app/store'

const getBaseState = (state: AppState) => state.notifications

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
