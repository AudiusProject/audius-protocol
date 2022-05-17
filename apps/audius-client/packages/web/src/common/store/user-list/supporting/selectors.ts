import { CommonState } from 'common/store'

export const getId = (state: CommonState) =>
  state.ui.userList.supporting.supportingPage.id
export const getUserList = (state: CommonState) =>
  state.ui.userList.supporting.userList
export const getUserIds = (state: CommonState) =>
  state.ui.userList.supporting.userList.userIds
