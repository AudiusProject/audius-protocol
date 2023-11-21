import { PayExtraPreset } from 'hooks/purchaseContent'
import { ContentType } from 'store/index'

import { ID } from './Identifiers'

export enum PurchaseMethod {
  BALANCE = 'balance',
  CARD = 'card',
  CRYPTO = 'crypto'
}

export enum PurchaseVendor {
  STRIPE = 'Stripe'
}

export type StartPurchaseContentFlowParams = {
  purchaseMethod: PurchaseMethod
  extraAmount: number
  extraAmountPreset: PayExtraPreset
  contentId: ID
  contentType: ContentType.TRACK
}
