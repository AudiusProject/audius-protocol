import { CommonState } from '~/store/commonStore'

export const getId = (state: CommonState) =>
  state.ui.userList.mutuals.mutualsPage.id
export const getUserList = (state: CommonState) =>
  state.ui.userList.mutuals.userList
export const getUserIds = (state: CommonState) =>
  state.ui.userList.mutuals.userList.userIds
