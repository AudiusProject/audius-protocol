import { CommonState } from 'common/store'

export const getIsOpen = (state: CommonState) =>
  state.ui.mobileUploadDrawer.isOpen
