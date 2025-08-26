import React from 'react'

import type { TokenPair } from '@audius/common/store'

import { SwapTab } from './SwapTab'

type SellScreenProps = {
  tokenPair: TokenPair
  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
    error: string | null
    isInsufficientBalance: boolean
  }) => void
  error?: boolean
  errorMessage?: string
  initialInputValue?: string
  onInputValueChange?: (value: string) => void
}

export const SellScreen = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange
}: SellScreenProps) => {
  if (!tokenPair) return null

  // Extract the tokens from the pair
  const { baseToken, quoteToken } = tokenPair

  return (
    <SwapTab
      inputToken={baseToken}
      outputToken={quoteToken}
      onTransactionDataChange={onTransactionDataChange}
      isDefault={false}
      error={error}
      errorMessage={errorMessage}
      initialInputValue={initialInputValue}
      onInputValueChange={onInputValueChange}
    />
  )
}
