import { CommonState } from '~/store/commonStore'

export const getId = (state: CommonState): string | null =>
  state.ui.userList.notifications.id
