import { CommonState } from 'common/store'

export const getId = (state: CommonState) =>
  state.ui.userList.topSupporters.topSupportersPage.id
export const getUserList = (state: CommonState) =>
  state.ui.userList.topSupporters.userList
export const getUserIds = (state: CommonState) =>
  state.ui.userList.topSupporters.userList.userIds
