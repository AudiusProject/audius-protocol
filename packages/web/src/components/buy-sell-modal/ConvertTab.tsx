import { useMemo, useCallback } from 'react'

import { useAudioBalance, useTokenBalance } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { TokenInfo, TokenPair } from '@audius/common/store'
import { isNullOrUndefined } from '@audius/common/utils'
import { AUDIO, FixedDecimal } from '@audius/fixed-decimal'

import { SwapTab } from './SwapTab'

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

  // Dynamically fetch balance for the currently selected input token
  const { accountBalance } = useAudioBalance({ includeConnectedWallets: false })
  const { data: tokenBalanceData, status: tokenBalanceStatus } =
    useTokenBalance({
      token: baseToken.symbol as any // Cast to satisfy the MintName type
    })

  // Fetch balance for the currently selected output token
  const { data: outputTokenBalanceData, status: outputTokenBalanceStatus } =
    useTokenBalance({
      token: quoteToken.symbol as any // Cast to satisfy the MintName type
    })

  // Determine loading state based on the selected token
  const isBalanceLoading = useMemo(() => {
    if (baseToken.symbol === 'AUDIO') {
      return isNullOrUndefined(accountBalance)
    } else {
      return tokenBalanceStatus === Status.LOADING
    }
  }, [baseToken.symbol, accountBalance, tokenBalanceStatus])

  // Get balance in UI format based on the selected token
  const getBalance = useMemo(() => {
    return () => {
      if (baseToken.symbol === 'AUDIO') {
        if (!isBalanceLoading && accountBalance) {
          return Number(AUDIO(accountBalance).toString())
        }
      } else {
        if (tokenBalanceStatus === Status.SUCCESS && tokenBalanceData) {
          return Number(new FixedDecimal(tokenBalanceData.toString()))
        }
      }
      return undefined
    }
  }, [
    accountBalance,
    isBalanceLoading,
    baseToken.symbol,
    tokenBalanceData,
    tokenBalanceStatus
  ])

  // Get balance for the output token
  const getOutputBalance = useMemo(() => {
    return () => {
      if (quoteToken.symbol === 'AUDIO') {
        if (accountBalance) {
          return Number(AUDIO(accountBalance).toString())
        }
      } else {
        if (
          outputTokenBalanceStatus === Status.SUCCESS &&
          outputTokenBalanceData
        ) {
          return Number(new FixedDecimal(outputTokenBalanceData.toString()))
        }
      }
      return undefined
    }
  }, [
    accountBalance,
    quoteToken.symbol,
    outputTokenBalanceData,
    outputTokenBalanceStatus
  ])

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
      balance={{
        get: getBalance,
        loading: isBalanceLoading,
        formatError: () => 'Insufficient balance'
      }}
      outputBalance={{
        get: getOutputBalance,
        loading: outputTokenBalanceStatus === Status.LOADING,
        formatError: () => 'Insufficient balance'
      }}
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
