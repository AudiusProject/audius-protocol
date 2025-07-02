import { useMemo } from 'react'

import { useTokenPrice, useTokenBalance } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { MintName } from '@audius/common/services'
import { TokenPair, TokenInfo } from '@audius/common/store'
import { getCurrencyDecimalPlaces } from '@audius/common/utils'

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
  availableInputTokens?: TokenInfo[]
  availableOutputTokens?: TokenInfo[]
  onInputTokenChange?: (symbol: string) => void
  onOutputTokenChange?: (symbol: string) => void
}

export const BuyTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange,
  availableInputTokens,
  availableOutputTokens,
  onInputTokenChange,
  onOutputTokenChange
}: BuyTabProps) => {
  const { baseToken, quoteToken } = tokenPair

  // Determine which balance hook to use based on input token
  const mintName = useMemo(() => {
    switch (quoteToken.symbol) {
      case 'USDC':
        return 'USDC' as MintName
      case 'AUDIO':
        return 'wAUDIO' as MintName
      case 'TRUMP':
        return 'TRUMP' as MintName
      default:
        return 'USDC' as MintName
    }
  }, [quoteToken.symbol])

  const { status: balanceStatus, data: tokenBalanceData } = useTokenBalance({
    token: mintName
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
        return parseFloat(tokenBalanceData.toString())
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
      availableOutputTokens={availableOutputTokens}
      onOutputTokenChange={onOutputTokenChange}
    />
  )
}
