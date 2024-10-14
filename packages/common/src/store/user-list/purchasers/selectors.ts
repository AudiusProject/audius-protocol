import { CommonState } from '~/store/commonStore'
import { PurchaseableContentType } from '~/store/purchase-content'

import { ID } from '../../../models/Identifiers'
import { UserListStoreState } from '../types'

export const getId = (state: CommonState): ID | null =>
  state.ui.userList.purchasers.purchasersPage.id
export const getUserList = (state: CommonState): UserListStoreState =>
  state.ui.userList.purchasers.userList
export const getUserIds = (state: CommonState): ID[] =>
  state.ui.userList.purchasers.userList.userIds
export const getContentId = (state: CommonState): ID | undefined =>
  state.ui.userList.purchasers.purchasersPage.contentId
export const getContentType = (
  state: CommonState
): PurchaseableContentType | undefined =>
  state.ui.userList.purchasers.purchasersPage.contentType
