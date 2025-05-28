import type { ComponentType } from 'react'

import { TooltipPlacement } from 'antd/lib/tooltip'

export type BuySellTab = 'buy' | 'sell'

export type Screen = 'input' | 'confirm' | 'success'

export type TokenType = 'AUDIO' | 'USDC'

export type TokenInfo = {
  symbol: string // e.g., 'AUDIO', 'USDC', 'WETH'
  name: string // e.g., 'Audius', 'USD Coin', 'Wrapped Ether'
  icon?: ComponentType<any> // Component for the token's icon (optional to avoid circular deps)
  decimals: number // Number of decimal places (e.g., 18 for ETH)
  balance: number | null // User's balance for this token
  address?: string // Optional contract address
  isStablecoin?: boolean // Flag for UI formatting ($ prefix, etc.)
}

export type TokenPair = {
  baseToken: TokenInfo // The token being priced (e.g., AUDIO)
  quoteToken: TokenInfo // The token used for pricing (e.g., USDC)
  exchangeRate: number | null // Rate of baseToken in terms of quoteToken
}

// This type might be web-specific if TokenAmountSection is not made common.
// For now, keeping it as per original types.ts content.
export type TokenAmountSectionProps = {
  title: string
  tokenInfo: TokenInfo
  isInput: boolean
  amount: number | string
  onAmountChange?: (value: string) => void
  onMaxClick?: () => void
  availableBalance: number
  exchangeRate?: number | null
  placeholder?: string
  isDefault?: boolean
  error?: boolean
  errorMessage?: string
  tokenPrice?: string | null
  isTokenPriceLoading?: boolean
  tokenPriceDecimalPlaces?: number
  tooltipPlacement?: TooltipPlacement
}

// Data structure for the transaction success screen
export type SuccessDisplayData = {
  payTokenInfo: TokenInfo
  receiveTokenInfo: TokenInfo
  payAmount: number
  receiveAmount: number
  pricePerBaseToken: number
  baseTokenSymbol: string
}

export type SwapResult = {
  inputAmount: number
  outputAmount: number
}

export type TransactionData = {
  inputAmount: number
  outputAmount: number
  isValid: boolean
} | null
