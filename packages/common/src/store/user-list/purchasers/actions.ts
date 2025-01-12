import { createCustomAction } from 'typesafe-actions'

import { ID } from '~/models/Identifiers'
import type { PurchaseableContentType } from '~/store/purchase-content'

export const SET_PURCHASERS = 'PURCHASERS_USER_PAGE/SET_PURCHASERS'

export const setPurchasers = createCustomAction(
  SET_PURCHASERS,
  (
    id: ID,
    contentType: PurchaseableContentType | undefined,
    contentId: number | undefined
  ) => ({
    id,
    contentType,
    contentId
  })
)
