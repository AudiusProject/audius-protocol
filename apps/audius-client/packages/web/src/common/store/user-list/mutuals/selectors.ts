import { CommonState } from 'common/store'

export const getId = (state: CommonState) =>
  state.ui.userList.mutuals.mutualsPage.id
export const getUserList = (state: CommonState) =>
  state.ui.userList.mutuals.userList
export const getUserIds = (state: CommonState) =>
  state.ui.userList.mutuals.userList.userIds
