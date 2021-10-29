import { AppState } from 'src/store'

const getBaseState = (state: AppState) => state.oauth

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
export const getUrl = (state: AppState) => getBaseState(state).url
export const getMessageId = (state: AppState) => getBaseState(state).messageId
export const getMessageType = (state: AppState) =>
  getBaseState(state).messageType
export const getAuthProvider = (state: AppState) => getBaseState(state).provider
export const getTwitterInfo = (state: AppState) =>
  getBaseState(state).twitterInfo
export const getTwitterError = (state: AppState) =>
  getBaseState(state).twitterError
export const getInstagramInfo = (state: AppState) =>
  getBaseState(state).instagramInfo
export const getInstagramError = (state: AppState) =>
  getBaseState(state).instagramError
