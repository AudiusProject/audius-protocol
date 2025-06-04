export type BuySellScreenParams = {
  initialTab?: 'buy' | 'sell'
}

export type ConfirmSwapScreenParams = {
  swapData: {
    payTokenInfo: any // TokenInfo from common
    receiveTokenInfo: any // TokenInfo from common
    payAmount: number
    receiveAmount: number
    pricePerBaseToken: number
    baseTokenSymbol: string
  }
}

export type TransactionResultScreenParams = {
  result: {
    status: 'success' | 'error'
    signature?: string
    error?: {
      type: string
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
  type: 'swap' | 'buy' | 'sell'
}

// This will be extended with the main app navigation types when integrated
export type BuySellStackParamList = {
  BuySellScreen: BuySellScreenParams
  ConfirmSwapScreen: ConfirmSwapScreenParams
  TransactionResultScreen: TransactionResultScreenParams
}
