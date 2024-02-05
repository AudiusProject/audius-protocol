import { CommonState } from '~/store/commonStore'

export const getHasPublicTracks = (state: CommonState) =>
  state.ui.uploadConfirmationModal.hasPublicTracks

export const getConfirmCallback = (state: CommonState) =>
  state.ui.uploadConfirmationModal.confirmCallback
