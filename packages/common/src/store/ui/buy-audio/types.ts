import { TOKEN_LISTING_MAP } from './constants'

export enum OnRampProvider {
  COINBASE = 'coinbase',
  STRIPE = 'stripe',
  UNKNOWN = 'unknown'
}

export type JupiterTokenSymbol = keyof typeof TOKEN_LISTING_MAP

export enum PurchaseInfoErrorType {
  MAX_AUDIO_EXCEEDED = 'max_audio_exceeded',
  MIN_AUDIO_EXCEEDED = 'min_audio_exceeded',
  UNKNOWN = 'unknown'
}

export enum BuyAudioStage {
  START = 'START',
  PURCHASING = 'PURCHASING',
  CONFIRMING_PURCHASE = 'CONFIRMING_PURCHASE',
  SWAPPING = 'SWAPPING',
  CONFIRMING_SWAP = 'CONFIRMING_SWAP',
  TRANSFERRING = 'TRANSFERRING',
  FINISH = 'FINISH'
}

export type AmountObject = {
  amount: number
  amountString: string
  uiAmount: number
  uiAmountString: string
}
