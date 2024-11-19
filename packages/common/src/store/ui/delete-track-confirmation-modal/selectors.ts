import { CommonState } from '~/store/commonStore'

export const getTrackId = (state: CommonState) =>
  state.ui.deleteTrackConfirmationModal.trackId
