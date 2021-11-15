import { CommonState } from 'common/store/'

export const getIsOpen = (state: CommonState) =>
  state.ui.deletePlaylistConfirmationModal.isOpen
export const getPlaylistId = (state: CommonState) =>
  state.ui.deletePlaylistConfirmationModal.playlistId
