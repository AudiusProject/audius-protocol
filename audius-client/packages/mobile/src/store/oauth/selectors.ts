import { AppState } from 'src/store'

const getBaseState = (state: AppState) => state.oauth

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
export const getUrl = (state: AppState) => getBaseState(state).url
export const getMessageId = (state: AppState) => getBaseState(state).messageId
export const getAuthProvider = (state: AppState) => getBaseState(state).provider
