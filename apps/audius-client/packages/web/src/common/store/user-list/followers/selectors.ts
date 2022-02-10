import { CommonState } from 'common/store'

export const getId = (state: CommonState) =>
  state.ui.userList.followers.followersPage.id
export const getUserList = (state: CommonState) =>
  state.ui.userList.followers.userList
export const getUserIds = (state: CommonState) =>
  state.ui.userList.followers.userList.userIds
