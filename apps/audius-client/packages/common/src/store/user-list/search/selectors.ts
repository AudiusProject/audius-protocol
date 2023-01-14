import { CommonState } from '../../commonStore'

export const getQuery = (state: CommonState) =>
  state.ui.userList.search.searchPage.query
export const getUserList = (state: CommonState) =>
  state.ui.userList.search.userList
export const getUserIds = (state: CommonState) =>
  state.ui.userList.search.userList.userIds
