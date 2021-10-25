import { CommonState } from 'common/store'

export const getMobileOverflowModal = (state: CommonState) =>
  state.ui.mobileOverflowModal

export const getIsOpen = (state: CommonState) =>
  state.ui.mobileOverflowModal.isOpen
