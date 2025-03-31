import { CommonState } from '~/store/commonStore'

export const getId = (state: CommonState) => state.ui.userList.reposts.id
export const getRepostsType = (state: CommonState) =>
  state.ui.userList.reposts.repostType
