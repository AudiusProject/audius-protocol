import { ID } from '~/models/Identifiers'
import { CommonState } from '~/store/commonStore'

export const getId = (state: CommonState): ID | null =>
  state.ui.userList.purchasers.id
