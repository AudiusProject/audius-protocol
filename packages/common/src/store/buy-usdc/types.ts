export enum USDCOnRampProvider {
  COINBASE = 'coinbase',
  STRIPE = 'stripe',
  UNKNOWN = 'unknown'
}

export type PurchaseInfo = {
  /**
   * Desired amount of USDC in *cents*
   */
  desiredAmount: number
}

export enum BuyUSDCStage {
  START = 'START',
  PURCHASING = 'PURCHASING',
  CONFIRMING_PURCHASE = 'CONFIRMING_PURCHASE',
  CANCELED = 'CANCELED',
  FINISH = 'FINISH'
}
