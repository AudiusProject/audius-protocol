/**
 * From Jupiter API documentation:
 * https://docs.jup.ag/jupiter-core/jupiter-sdk/v2/full-guide
 * "6. Configure the input token, output token"
 */
export type JupiterTokenListing = {
  chainId: number // 101,
  address: string // 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: string // 'USDC',
  name: string // 'Wrapped USDC',
  decimals: number // 6,
  logoURI: string // 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW/logo.png',
}

export enum OnRampProvider {
  COINBASE = 'coinbase',
  STRIPE = 'stripe',
  UNKNOWN = 'unknown'
}

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
