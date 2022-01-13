import { AppState } from 'store/types'

export const getId = (state: AppState) =>
  state.application.pages.following.followingPage.id
export const getUserList = (state: AppState) =>
  state.application.pages.following.userList
export const getUserIds = (state: AppState) =>
  state.application.pages.following.userList.userIds
