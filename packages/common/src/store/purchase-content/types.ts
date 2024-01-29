import { BuyCryptoErrorCode } from 'store/buy-crypto/types'

import { BuyUSDCErrorCode } from '../buy-usdc'

export enum ContentType {
  TRACK = 'track'
}

export enum PurchaseContentStage {
  IDLE = 'IDLE',
  START = 'START',
  BUY_USDC = 'BUY_USDC',
  PURCHASING = 'PURCHASING',
  CONFIRMING_PURCHASE = 'CONFIRMING_PURCHASE',
  CANCELED = 'CANCELED',
  FINISH = 'FINISH'
}

export enum PurchaseContentPage {
  PURCHASE = 'purchase',
  TRANSFER = 'crypto-transfer'
}

export enum PurchaseErrorCode {
  Canceled = 'Canceled',
  InsufficientBalance = 'InsufficientBalance',
  Unknown = 'Unknown'
}

export type PurchaseContentErrorCode =
  | BuyUSDCErrorCode
  | BuyCryptoErrorCode
  | PurchaseErrorCode

export class PurchaseContentError extends Error {
  constructor(public code: PurchaseContentErrorCode, message: string) {
    super(message)
  }
}
