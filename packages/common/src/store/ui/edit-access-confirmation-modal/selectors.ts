import { CommonState } from '~/store/commonStore'

export const getType = (state: CommonState) =>
  state.ui.editAccessConfirmationModal.type

export const getConfirmCallback = (state: CommonState) =>
  state.ui.editAccessConfirmationModal.confirmCallback

export const getCancelCallback = (state: CommonState) =>
  state.ui.editAccessConfirmationModal.cancelCallback
