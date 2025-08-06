import { TokenInfo, TokenPair } from '@audius/common/store'
import { TooltipPlacement } from 'antd/lib/tooltip'

// Balance configuration for token operations
export type BalanceConfig = {
  get: () => number | undefined
  loading: boolean
  formatError: () => string
}

// Balance configuration for both input and output tokens
export type BalanceConfiguration = {
  input: BalanceConfig
  output?: BalanceConfig
}

// Transaction data structure
export type TransactionData = {
  inputAmount: number
  outputAmount: number
  isValid: boolean
  error: string | null
  isInsufficientBalance: boolean
}

// UI configuration options
export type UIConfiguration = {
  isDefault?: boolean
  error?: boolean
  errorMessage?: string
  tooltipPlacement?: TooltipPlacement
}

// Token pricing configuration
export type TokenPricing = {
  tokenPrice?: string | null
  isTokenPriceLoading?: boolean
  tokenPriceDecimalPlaces?: number
}

// Input handling configuration
export type InputConfiguration = {
  initialInputValue?: string
  onInputValueChange?: (value: string) => void
  min?: number
  max?: number
}

// Token selection configuration
export type TokenSelection = {
  availableInputTokens?: TokenInfo[]
  availableOutputTokens?: TokenInfo[]
  onInputTokenChange?: (symbol: string) => void
  onOutputTokenChange?: (symbol: string) => void
}

// Callback functions
export type SwapCallbacks = {
  onTransactionDataChange?: (data: TransactionData) => void
}

// Main SwapTab props interface composed of smaller interfaces
export type SwapTabProps = {
  tokens: TokenPair
  balances: BalanceConfiguration
  configuration: UIConfiguration
  pricing: TokenPricing
  input: InputConfiguration
  tokenSelection: TokenSelection
  callbacks: SwapCallbacks
}

// Base props shared across all tab components
export type BaseTabProps = {
  tokenPair: TokenPair
  onTransactionDataChange?: (data: TransactionData) => void
  error?: boolean
  errorMessage?: string
  initialInputValue?: string
  onInputValueChange?: (value: string) => void
}

export type BuyTabProps = BaseTabProps & {
  availableOutputTokens?: TokenInfo[]
  onOutputTokenChange?: (symbol: string) => void
}

export type SellTabProps = BaseTabProps & {
  availableInputTokens?: TokenInfo[]
  onInputTokenChange?: (symbol: string) => void
}

export type ConvertTabProps = BaseTabProps & {
  availableTokens?: TokenInfo[]
  onInputTokenChange?: (symbol: string) => void
  onOutputTokenChange?: (symbol: string) => void
}

// Modal screen types
export type Screen = 'input' | 'confirm' | 'success'
