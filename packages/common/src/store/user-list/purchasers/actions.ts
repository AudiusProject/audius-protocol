import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'
import { PurchaseableContentType } from '~/store/purchase-content'
export const SET_PURCHASERS = 'PURCHASERS_USER_PAGE/SET_PURCHASERS'

export const setPurchasers = createCustomAction(
  SET_PURCHASERS,
  (contentId?: ID, contentType?: PurchaseableContentType) => ({
    contentId,
    contentType
  })
)
