import { ID } from '~/models/Identifiers'
import { PurchaseableContentType } from '~/store/purchase-content'

export type PurchasersPageState = {
  contentId: ID | null
  contentType: PurchaseableContentType | null
}

export const PURCHASERS_USER_LIST_TAG = 'PURCHASERS'
