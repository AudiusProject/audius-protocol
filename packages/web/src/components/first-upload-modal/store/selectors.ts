import { AppState } from 'store/types'

const getBaseState = (state: AppState) => state.application.ui.firstUploadModal

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
