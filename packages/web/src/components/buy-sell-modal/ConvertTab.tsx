import { useMemo, useCallback } from 'react'

import { TokenInfo, TokenPair } from '@audius/common/store'

import { SwapTab } from './SwapTab'
import { useTokenBalanceManager } from './hooks/useTokenBalanceManager'

type ConvertTabProps = {
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
  availableTokens?: TokenInfo[]
  onInputTokenChange?: (symbol: string) => void
  onOutputTokenChange?: (symbol: string) => void
}

export const ConvertTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange,
  availableTokens,
  onInputTokenChange,
  onOutputTokenChange
}: ConvertTabProps) => {
  // Extract the tokens from the pair
  const { baseToken, quoteToken } = tokenPair

  // Use shared token balance manager
  const { inputBalance, outputBalance } = useTokenBalanceManager(
    baseToken,
    quoteToken
  )

  // Filter available tokens to prevent same token selection and exclude USDC
  const availableInputTokens = useMemo(() => {
    return availableTokens?.filter(
      (token) => token.symbol !== baseToken.symbol && token.symbol !== 'USDC'
    )
  }, [availableTokens, baseToken.symbol])

  const availableOutputTokens = useMemo(() => {
    return availableTokens?.filter(
      (token) => token.symbol !== quoteToken.symbol && token.symbol !== 'USDC'
    )
  }, [availableTokens, quoteToken.symbol])

  // Enhanced token change handlers for automatic swapping when only 2 tokens available
  const handleInputTokenChange = useCallback(
    (symbol: string) => {
      onInputTokenChange?.(symbol)

      // If there are only 2 available tokens (excluding USDC), automatically set the other as output
      const nonUSDCTokens = availableTokens?.filter(
        (token) => token.symbol !== 'USDC'
      )
      if (nonUSDCTokens?.length === 2) {
        const otherToken = nonUSDCTokens.find(
          (token) => token.symbol !== symbol
        )
        if (otherToken) {
          onOutputTokenChange?.(otherToken.symbol)
        }
      }
    },
    [onInputTokenChange, onOutputTokenChange, availableTokens]
  )

  const handleOutputTokenChange = useCallback(
    (symbol: string) => {
      onOutputTokenChange?.(symbol)

      // If there are only 2 available tokens (excluding USDC), automatically set the other as input
      const nonUSDCTokens = availableTokens?.filter(
        (token) => token.symbol !== 'USDC'
      )
      if (nonUSDCTokens?.length === 2) {
        const otherToken = nonUSDCTokens.find(
          (token) => token.symbol !== symbol
        )
        if (otherToken) {
          onInputTokenChange?.(otherToken.symbol)
        }
      }
    },
    [onInputTokenChange, onOutputTokenChange, availableTokens]
  )

  return (
    <SwapTab
      inputToken={baseToken}
      outputToken={quoteToken}
      balance={inputBalance}
      outputBalance={outputBalance}
      onTransactionDataChange={onTransactionDataChange}
      isDefault={false}
      error={error}
      errorMessage={errorMessage}
      tooltipPlacement='right'
      initialInputValue={initialInputValue}
      onInputValueChange={onInputValueChange}
      availableInputTokens={availableInputTokens}
      availableOutputTokens={availableOutputTokens}
      onInputTokenChange={handleInputTokenChange}
      onOutputTokenChange={handleOutputTokenChange}
      showExchangeRate
    />
  )
}
