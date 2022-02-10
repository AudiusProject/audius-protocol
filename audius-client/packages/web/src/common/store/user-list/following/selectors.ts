import { CommonState } from 'common/store'

export const getId = (state: CommonState) =>
  state.ui.userList.following.followingPage.id
export const getUserList = (state: CommonState) =>
  state.ui.userList.following.userList
export const getUserIds = (state: CommonState) =>
  state.ui.userList.following.userList.userIds
