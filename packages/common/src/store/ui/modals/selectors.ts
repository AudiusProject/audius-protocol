import { CommonState } from 'store/commonStore'

import { Modals } from './types'

export const getModalVisibility = (state: CommonState, modal: Modals) =>
  state.ui.modals[modal]

export const getModalIsOpen = (state: CommonState) =>
  Object.values(state.ui.modals).some((isOpen) => isOpen)
