import type { TokenInfo, SuccessDisplayData } from '@audius/common/store'

export type BuySellScreenParams = {
  initialTab?: 'buy' | 'sell'
  coinTicker?: string
}

export type ConfirmSwapScreenParams = {
  confirmationData: {
    payTokenInfo: TokenInfo
    receiveTokenInfo: TokenInfo
    payAmount: number
    receiveAmount: number
    pricePerBaseToken: number
    baseTokenSymbol: string
  }
}

export type TransactionResultScreenParams = {
  result: {
    status: 'success' | 'error'
    data?: SuccessDisplayData
    error?: { message?: string }
  }
}

// This will be extended with the main app navigation types when integrated
export type BuySellStackParamList = {
  BuySellMain: BuySellScreenParams
  ConfirmSwapScreen: ConfirmSwapScreenParams
  TransactionResultScreen: TransactionResultScreenParams
}
