import type { AppState } from 'app/store'

export const getIsKeyboardOpen = (state: AppState) => state.keyboard.isOpen
