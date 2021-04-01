import { AppState } from 'src/store'

const getBaseState = (state: AppState) => state.notifications

export const getIsOpen = (state: AppState) => getBaseState(state).isOpen
export const getNotifications = (state: AppState) =>
  getBaseState(state).notifications
export const getStatus = (state: AppState) => getBaseState(state).status
export const getEndReached = (state: AppState) => getBaseState(state).endReached
