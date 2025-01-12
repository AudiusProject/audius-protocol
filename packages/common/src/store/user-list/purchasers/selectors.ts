import { ID } from '~/models/Identifiers'
import { CommonState } from '~/store/commonStore'
import type { PurchaseableContentType } from '~/store/purchase-content'

export const getId = (state: CommonState): ID | null =>
  state.ui.userList.purchasers.id

export const getContentType = (
  state: CommonState
): PurchaseableContentType | undefined =>
  state.ui.userList.purchasers.contentType

export const getContentId = (state: CommonState): number | undefined =>
  state.ui.userList.purchasers.contentId
