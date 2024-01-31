import { CommonState } from '~/store/commonStore'

export const getConfirmCallback = (state: CommonState) =>
  state.ui.publishTrackConfirmationModal.confirmCallback
