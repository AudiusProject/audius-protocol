import { ID } from '~/models/Identifiers'
import { CommonState } from '~/store/commonStore'
import { PurchaseableContentType } from '~/store/purchase-content'

export const getContentId = (state: CommonState): ID | null =>
  state.ui.userList.purchasers.contentId

export const getContentType = (
  state: CommonState
): PurchaseableContentType | null => state.ui.userList.purchasers.contentType
