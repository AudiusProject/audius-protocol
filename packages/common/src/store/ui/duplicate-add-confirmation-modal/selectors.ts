import { CommonState } from '~/store/commonStore'

export const getPlaylistId = (state: CommonState) =>
  state.ui.duplicateAddConfirmationModal.playlistId

export const getTrackId = (state: CommonState) =>
  state.ui.duplicateAddConfirmationModal.trackId
