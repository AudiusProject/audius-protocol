import { useMemo } from 'react'

import { useTokenPrice } from '@audius/common/api'
import { getCurrencyDecimalPlaces } from '@audius/common/utils'

import { SwapTab } from './SwapTab'
import type { BuyTabProps } from './types'

export const BuyTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange,
  availableOutputTokens,
  onOutputTokenChange,
  initialMint
}: BuyTabProps) => {
  const { baseToken, quoteToken } = tokenPair

  const { data: tokenPriceData, isPending: isTokenPriceLoading } =
    useTokenPrice(baseToken.address)

  const tokenPrice = tokenPriceData?.price || null

  const decimalPlaces = useMemo(() => {
    if (!tokenPrice) return 2
    return getCurrencyDecimalPlaces(parseFloat(tokenPrice))
  }, [tokenPrice])

  return (
    <SwapTab
      inputToken={quoteToken}
      outputToken={baseToken}
      onTransactionDataChange={onTransactionDataChange}
      inputIsDefault={true} // Keep input section as DefaultBalanceSection
      outputIsDefault={false} // Enable StackedBalanceSection for "You Receive"
      error={error}
      errorMessage={errorMessage}
      tokenPrice={tokenPrice}
      isTokenPriceLoading={isTokenPriceLoading}
      tokenPriceDecimalPlaces={decimalPlaces}
      initialInputValue={initialInputValue}
      onInputValueChange={onInputValueChange}
      availableOutputTokens={availableOutputTokens}
      onOutputTokenChange={onOutputTokenChange}
      initialMint={initialMint}
    />
  )
}
