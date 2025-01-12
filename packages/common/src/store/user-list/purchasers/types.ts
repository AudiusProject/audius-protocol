import { ID } from '~/models/Identifiers'
import type { PurchaseableContentType } from '~/store/purchase-content'

export type PurchasersPageState = {
  id: ID | null
  contentType: PurchaseableContentType | undefined
  contentId: number | undefined
}

export const PURCHASERS_USER_LIST_TAG = 'PURCHASERS'
