import { CommonState } from 'store/index'

export const getPresetMessage = (state: CommonState) =>
  state.ui.createChatModal.presetMessage

export const getOnCancelAction = (state: CommonState) =>
  state.ui.createChatModal.onCancelAction
