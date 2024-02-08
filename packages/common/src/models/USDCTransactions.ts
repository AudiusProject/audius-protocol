import { Nullable } from '../utils/typeUtils'

import { StringUSDC } from './Wallet'

export enum USDCTransactionType {
  PURCHASE_STRIPE = 'purchase_stripe',
  PURCHASE_CONTENT = 'purchase_content',
  TRANSFER = 'transfer',
  WITHDRAWAL = 'withdrawal'
}

export enum USDCTransactionMethod {
  SEND = 'send',
  RECEIVE = 'receive'
}

export enum USDCContentPurchaseType {
  TRACK = 'track'
}

export type USDCPurchaseDetails = {
  signature: string
  sellerUserId: number
  buyerUserId: number
  amount: StringUSDC
  extraAmount: StringUSDC
  contentType: USDCContentPurchaseType
  contentId: number
  createdAt: string
}

export type USDCTransactionDetails = {
  signature: string
  transactionType: USDCTransactionType
  method: USDCTransactionMethod
  transactionDate: string
  change: StringUSDC
  balance: StringUSDC
  metadata?: Nullable<object> | string
}
