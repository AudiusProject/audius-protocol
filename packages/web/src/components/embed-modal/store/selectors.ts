import { AppState } from 'store/types'

export const getIsOpen = (state: AppState) =>
  state.application.ui.embedModal.isOpen
export const getId = (state: AppState) => state.application.ui.embedModal.id
export const getKind = (state: AppState) => state.application.ui.embedModal.kind
