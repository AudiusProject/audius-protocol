import { Nullable } from '../utils/typeUtils'

import { StringUSDC } from './Wallet'

export enum USDCTransactionType {
  PURCHASE_USDC = 'PURCHASE_USDC',
  PURCHASE_CONTENT = 'PURCHASE_CONTENT',
  TRANSFER = 'TRANSFER'
}

export enum USDCTransactionMethod {
  // Transfer methods
  SEND = 'SENT',
  RECEIVE = 'RECEIVED',

  // Purchase Methods
  STRIPE = 'STRIPE'
}

export type InAppUSDCPurchaseMetadata = {
  discriminator: USDCTransactionType.PURCHASE_USDC
  usd: string
  usdc: StringUSDC
  purchaseTransactionId: string
}

export enum USDCContentPurchaseType {
  TRACK = 'track'
}

export type USDCPurchaseDetails = {
  signature: string
  sellerUserId: number
  buyerUserId: number
  amount: StringUSDC
  contentType: USDCContentPurchaseType
  contentId: number
  createdAt: string
}

export type USDCPurchaseContentMetadata = {
  discriminator: USDCTransactionType.PURCHASE_CONTENT
  amount: StringUSDC
  senderUserId: string
  receiverUserId: string
  purchaseType: USDCContentPurchaseType
  contentId: number
}

export type USDCTransferMetadata = {
  discriminator: USDCTransactionType.TRANSFER
  amount: StringUSDC
  destination: string
}

export type USDCTransactionDetails =
  | {
      signature: string
      transactionType: USDCTransactionType.PURCHASE_USDC
      method: USDCTransactionMethod.STRIPE
      date: string
      change: StringUSDC
      balance: StringUSDC
      metadata?: Nullable<InAppUSDCPurchaseMetadata>
    }
  | {
      signature: string
      transactionType: USDCTransactionType.PURCHASE_CONTENT
      method: USDCTransactionMethod.SEND | USDCTransactionMethod.RECEIVE
      date: string
      change: StringUSDC
      balance: StringUSDC
      metadata?: Nullable<USDCPurchaseContentMetadata>
    }
  | {
      signature: string
      transactionType: USDCTransactionType.TRANSFER
      method: USDCTransactionMethod.SEND | USDCTransactionMethod.RECEIVE
      date: string
      change: StringUSDC
      balance: StringUSDC
      metadata?: Nullable<USDCTransferMetadata>
    }
