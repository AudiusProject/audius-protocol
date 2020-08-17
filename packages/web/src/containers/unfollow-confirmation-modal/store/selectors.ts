import { AppState } from 'store/types'

export const getIsOpen = (state: AppState) =>
  state.application.pages.unfollowConfirmation.isOpen
export const getUserId = (state: AppState) =>
  state.application.pages.unfollowConfirmation.userId
