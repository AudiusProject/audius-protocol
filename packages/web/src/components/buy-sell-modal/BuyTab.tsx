import { useMemo } from 'react'

import { useTokenBalance, useTokenPrice } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { TokenPair } from '@audius/common/store'
import { getCurrencyDecimalPlaces } from '@audius/common/utils'
import { FixedDecimal } from '@audius/fixed-decimal'

import { SwapTab } from './SwapTab'

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
}

export const BuyTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange
}: BuyTabProps) => {
  const { baseToken, quoteToken } = tokenPair

  const { status: balanceStatus, data: tokenBalanceData } = useTokenBalance({
    token: 'USDC'
  })

  const { data: tokenPriceData, isPending: isTokenPriceLoading } =
    useTokenPrice(baseToken.address)

  const tokenPrice = tokenPriceData?.price || null

  const decimalPlaces = useMemo(() => {
    if (!tokenPrice) return 2
    return getCurrencyDecimalPlaces(parseFloat(tokenPrice))
  }, [tokenPrice])

  const getBalance = useMemo(() => {
    return () => {
      if (balanceStatus === Status.SUCCESS && tokenBalanceData) {
        return Number(new FixedDecimal(tokenBalanceData.toString()))
      }
      return undefined
    }
  }, [balanceStatus, tokenBalanceData])

  return (
    <SwapTab
      inputToken={quoteToken}
      outputToken={baseToken}
      balance={{
        get: getBalance,
        loading: balanceStatus === Status.LOADING,
        formatError: () => 'Insufficient balance'
      }}
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
