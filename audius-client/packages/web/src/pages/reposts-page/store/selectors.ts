import { AppState } from 'store/types'

export const getId = (state: AppState) =>
  state.application.pages.reposts.repostsPage.id
export const getRepostsType = (state: AppState) =>
  state.application.pages.reposts.repostsPage.repostType
export const getUserList = (state: AppState) =>
  state.application.pages.reposts.userList
export const getUserIds = (state: AppState) =>
  state.application.pages.reposts.userList.userIds
