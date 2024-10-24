import { PurchaseableContentType } from '~/store/purchase-content'
import { UserListStoreState } from '~/store/user-list/types'

import { ID } from '../../../models'

export type PurchasersOwnState = {
  id: ID | null
  contentType?: PurchaseableContentType
  contentId?: ID
}

export type PurchasersPageState = {
  purchasersPage: PurchasersOwnState
  userList: UserListStoreState
}

export const PURCHASERS_USER_LIST_TAG = 'PURCHASERS'
