import { AppState } from 'store/types'

export const getUserListType = (state: AppState) =>
  state.application.ui.userListModal.userListType
export const getIsOpen = (state: AppState) =>
  state.application.ui.userListModal.isOpen
