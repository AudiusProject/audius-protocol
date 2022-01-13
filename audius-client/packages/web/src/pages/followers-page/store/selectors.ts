import { AppState } from 'store/types'

export const getId = (state: AppState) =>
  state.application.pages.followers.followersPage.id
export const getUserList = (state: AppState) =>
  state.application.pages.followers.userList
export const getUserIds = (state: AppState) =>
  state.application.pages.followers.userList.userIds
