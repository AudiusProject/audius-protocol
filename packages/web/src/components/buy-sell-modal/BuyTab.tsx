import { useMemo } from 'react'

import { useTokenPrice } from '@audius/common/api'
import { TokenPair, TokenInfo } from '@audius/common/store'
import { getCurrencyDecimalPlaces } from '@audius/common/utils'

import { SwapTab } from './SwapTab'
import { useTokenBalanceManager } from './hooks/useTokenBalanceManager'

type BuyTabProps = {
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
  availableOutputTokens?: TokenInfo[]
  onOutputTokenChange?: (symbol: string) => void
}

export const BuyTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange,
  availableOutputTokens,
  onOutputTokenChange
}: BuyTabProps) => {
  const { baseToken, quoteToken } = tokenPair

  // Use shared token balance manager for both input (USDC) and output token balances
  const { inputBalance, outputBalance } = useTokenBalanceManager(
    quoteToken, // Input token (USDC)
    baseToken // Output token (artist coin, etc.)
  )

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
      balance={inputBalance}
      outputBalance={outputBalance}
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
    />
  )
}
