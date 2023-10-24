import { BuyUSDCErrorCode } from '../buy-usdc'

export enum ContentType {
  TRACK = 'track'
}

export enum PurchaseContentStage {
  START = 'START',
  BUY_USDC = 'BUY_USDC',
  PURCHASING = 'PURCHASING',
  CONFIRMING_PURCHASE = 'CONFIRMING_PURCHASE',
  CANCELED = 'CANCELED',
  FINISH = 'FINISH'
}

export enum PurchaseErrorCode {
  Unknown = 'Unknown'
}

export type PurchaseContentErrorCode = BuyUSDCErrorCode | PurchaseErrorCode

export class PurchaseContentError extends Error {
  constructor(public code: PurchaseContentErrorCode, message: string) {
    super(message)
  }
}
