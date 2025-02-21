import { CommonState } from '~/store/commonStore'

import { Modals } from './types'

export const getModalVisibility = (state: CommonState, modal: Modals) =>
  state.ui.modals[modal].isOpen

export const getModalIsOpen = (state: CommonState) =>
  Object.values(state.ui.modals).some((modalState) => modalState.isOpen)
