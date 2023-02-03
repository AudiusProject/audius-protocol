import { CommonState } from 'store/reducers'

export const getUserList = (state: CommonState) =>
  state.ui.searchUsersModal.userList
