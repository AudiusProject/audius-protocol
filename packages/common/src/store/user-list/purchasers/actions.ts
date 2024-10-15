import { createCustomAction } from 'typesafe-actions'

import type { PurchaseableContentType } from '~/store/purchase-content'

import { ID } from '../../../models'

export const SET_PURCHASERS = 'PURCHASERS_USER_PAGE/SET_PURCHASERS'
export const GET_PURCHASERS_ERROR = 'PURCHASERS_USER_PAGE/GET_PURCHASERS_ERROR'

export const setPurchasers = createCustomAction(
  SET_PURCHASERS,
  (id: ID, contentType?: PurchaseableContentType, contentId?: ID) => ({
    id,
    contentType,
    contentId
  })
)
export const getPurchasersError = createCustomAction(
  GET_PURCHASERS_ERROR,
  (
    id: ID,
    error: string,
    contentType?: PurchaseableContentType,
    contentId?: ID
  ) => ({
    id,
    contentType,
    contentId,
    error
  })
)
