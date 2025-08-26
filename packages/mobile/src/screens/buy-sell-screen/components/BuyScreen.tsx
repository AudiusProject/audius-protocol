import React, { useMemo } from 'react'

import { useTokenPrice } from '@audius/common/api'
import type { TokenPair } from '@audius/common/store'
import { getCurrencyDecimalPlaces } from '@audius/common/utils'

import { SwapTab } from './SwapTab'

type BuyScreenProps = {
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

export const BuyScreen = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange
}: BuyScreenProps) => {
  const { data: tokenPriceData, isPending: isTokenPriceLoading } =
    useTokenPrice(tokenPair ? tokenPair.baseToken.address : '')

  const tokenPrice = tokenPriceData?.price || null

  const decimalPlaces = useMemo(() => {
    if (!tokenPrice) return 2
    return getCurrencyDecimalPlaces(parseFloat(tokenPrice))
  }, [tokenPrice])

  if (!tokenPair) return null

  return (
    <SwapTab
      inputToken={tokenPair.quoteToken}
      outputToken={tokenPair.baseToken}
      onTransactionDataChange={onTransactionDataChange}
      error={error}
      errorMessage={errorMessage}
      tokenPrice={tokenPrice}
      isTokenPriceLoading={isTokenPriceLoading}
      tokenPriceDecimalPlaces={decimalPlaces}
      initialInputValue={initialInputValue}
      onInputValueChange={onInputValueChange}
    />
  )
}
