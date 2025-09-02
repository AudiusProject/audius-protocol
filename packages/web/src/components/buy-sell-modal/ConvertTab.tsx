import { useCallback, useMemo } from 'react'

import { SwapTab } from './SwapTab'
import { ConvertTabProps } from './types'

export const ConvertTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange,
  availableInputTokens,
  availableOutputTokens,
  onInputTokenChange,
  onOutputTokenChange,
  onChangeSwapDirection
}: ConvertTabProps) => {
  // Extract the tokens from the pair
  const { baseToken, quoteToken } = tokenPair

  const handleChangeSwapDirection = useCallback(() => {
    if (onInputTokenChange && onOutputTokenChange) {
      onInputTokenChange(quoteToken.symbol)
      onOutputTokenChange(baseToken.symbol)
    }
    onChangeSwapDirection?.()
  }, [
    baseToken.symbol,
    quoteToken.symbol,
    onInputTokenChange,
    onOutputTokenChange,
    onChangeSwapDirection
  ])

  const totalAvailableTokens = useMemo(() => {
    const allTokens = [
      ...(availableInputTokens ?? []),
      ...(availableOutputTokens ?? [])
    ]
    return allTokens.filter(
      (token, index, arr) =>
        arr.findIndex((t) => t.symbol === token.symbol) === index
    ) // Remove duplicates
  }, [availableInputTokens, availableOutputTokens])

  // Generic token change handler with automatic swapping when only 2 tokens are available
  const createTokenChangeHandler = useCallback(
    (
      primaryCallback?: (symbol: string) => void,
      secondaryCallback?: (symbol: string) => void
    ) =>
      (symbol: string) => {
        primaryCallback?.(symbol)

        // If there are only 2 total available tokens, automatically set the other token
        if (totalAvailableTokens.length === 2) {
          const otherToken = totalAvailableTokens.find(
            (token) => token.symbol !== symbol
          )
          if (otherToken) {
            secondaryCallback?.(otherToken.symbol)
          }
        }
      },
    [totalAvailableTokens]
  )

  const handleInputTokenChange = useMemo(
    () => createTokenChangeHandler(onInputTokenChange, onOutputTokenChange),
    [createTokenChangeHandler, onInputTokenChange, onOutputTokenChange]
  )

  const handleOutputTokenChange = useMemo(
    () => createTokenChangeHandler(onOutputTokenChange, onInputTokenChange),
    [createTokenChangeHandler, onOutputTokenChange, onInputTokenChange]
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
      onChangeSwapDirection={handleChangeSwapDirection}
    />
  )
}
