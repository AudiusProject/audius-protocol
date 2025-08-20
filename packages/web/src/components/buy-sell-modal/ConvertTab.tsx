import { useMemo, useCallback } from 'react'

import { SwapTab } from './SwapTab'
import type { ConvertTabProps } from './types'

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

  // Filter available tokens to prevent same token selection
  const availableInputTokens = useMemo(() => {
    return availableTokens?.filter(
      (token) =>
        token.symbol !== baseToken.symbol && token.symbol !== quoteToken.symbol
    )
  }, [availableTokens, baseToken.symbol, quoteToken.symbol])

  const availableOutputTokens = useMemo(() => {
    return availableTokens?.filter(
      (token) =>
        token.symbol !== quoteToken.symbol && token.symbol !== baseToken.symbol
    )
  }, [availableTokens, quoteToken.symbol, baseToken.symbol])

  // Enhanced token change handlers for automatic swapping when only 2 tokens available
  const handleInputTokenChange = useCallback(
    (symbol: string) => {
      onInputTokenChange?.(symbol)

      // If there are only 2 available tokens, automatically set the other as output
      if (availableTokens?.length === 2) {
        const otherToken = availableTokens.find(
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

      // If there are only 2 available tokens, automatically set the other as input
      if (availableTokens?.length === 2) {
        const otherToken = availableTokens.find(
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
      onTransactionDataChange={onTransactionDataChange}
      isDefault={false}
      tab='convert'
      error={error}
      errorMessage={errorMessage}
      tooltipPlacement='right'
      initialInputValue={initialInputValue}
      onInputValueChange={onInputValueChange}
      availableInputTokens={availableInputTokens}
      availableOutputTokens={availableOutputTokens}
      onInputTokenChange={handleInputTokenChange}
      onOutputTokenChange={handleOutputTokenChange}
    />
  )
}
