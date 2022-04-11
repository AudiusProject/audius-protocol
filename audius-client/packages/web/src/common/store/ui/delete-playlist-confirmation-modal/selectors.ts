import { CommonState } from 'common/store'

export const getPlaylistId = (state: CommonState) =>
  state.ui.deletePlaylistConfirmationModal.playlistId
