export enum SwapStatus {
  IDLE = 'IDLE',
  GETTING_QUOTE = 'GETTING_QUOTE',
  BUILDING_TRANSACTION = 'BUILDING_TRANSACTION',
  SENDING_TRANSACTION = 'SENDING_TRANSACTION',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum SwapErrorType {
  WALLET_ERROR = 'WALLET_ERROR',
  QUOTE_FAILED = 'QUOTE_FAILED',
  BUILD_FAILED = 'BUILD_FAILED',
  RELAY_FAILED = 'RELAY_FAILED',
  SIMULATION_FAILED = 'SIMULATION_FAILED',
  UNKNOWN = 'UNKNOWN'
}

export type SwapTokensParams = {
  inputMint: string
  outputMint: string
  amountUi: number
  slippageBps?: number
  wrapUnwrapSol?: boolean
}

export type SwapTokensResult = {
  status: SwapStatus
  signature?: string
  error?: {
    type: SwapErrorType
    message: string
  }
  inputAmount?: {
    amount: number
    uiAmount: number
  }
  outputAmount?: {
    amount: number
    uiAmount: number
  }
}

export type ClaimableTokenMint = 'wAUDIO' | 'USDC' | 'BONK'

export interface UserBankManagedTokenInfo {
  mintAddress: string
  claimableTokenMint: ClaimableTokenMint
  decimals: number
}
