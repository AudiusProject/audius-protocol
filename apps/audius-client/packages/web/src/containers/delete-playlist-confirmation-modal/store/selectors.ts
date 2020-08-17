import { AppState } from 'store/types'

export const getIsOpen = (state: AppState) =>
  state.application.pages.deletePlaylistConfirmation.isOpen
export const getPlaylistId = (state: AppState) =>
  state.application.pages.deletePlaylistConfirmation.playlistId
