import { CommonState } from 'common/store'

export const getId = (state: CommonState) =>
  state.ui.userList.reposts.repostsPage.id
export const getRepostsType = (state: CommonState) =>
  state.ui.userList.reposts.repostsPage.repostType
export const getUserList = (state: CommonState) =>
  state.ui.userList.reposts.userList
export const getUserIds = (state: CommonState) =>
  state.ui.userList.reposts.userList.userIds
