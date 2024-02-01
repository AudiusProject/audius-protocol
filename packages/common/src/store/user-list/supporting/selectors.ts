import { CommonState } from '~/store/commonStore'

import { ID } from '../../../models/Identifiers'
import { UserListStoreState } from '../types'

import { SupportingOwnState } from './types'

export const getId = (state: CommonState): SupportingOwnState['id'] =>
  state.ui.userList.supporting.supportingPage.id
export const getUserList = (state: CommonState): UserListStoreState =>
  state.ui.userList.supporting.userList
export const getUserIds = (state: CommonState): ID[] =>
  state.ui.userList.supporting.userList.userIds
