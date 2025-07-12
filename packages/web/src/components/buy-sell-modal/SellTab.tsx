import { useMemo } from 'react'

import { useAudioBalance, useTokenBalance } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { TokenInfo, TokenPair } from '@audius/common/store'
import { isNullOrUndefined } from '@audius/common/utils'
import { AUDIO, FixedDecimal } from '@audius/fixed-decimal'

import { SwapTab } from './SwapTab'

type SellTabProps = {
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

export const SellTab = ({
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
}: SellTabProps) => {
  // Extract the tokens from the pair
  const { baseToken, quoteToken } = tokenPair

  // For AUDIO, use the specialized hook for compatibility
  const { accountBalance } = useAudioBalance({ includeConnectedWallets: false })
  const { data: tokenBalanceData, status: tokenBalanceStatus } =
    useTokenBalance({
      token: 'wAUDIO'
    })

  const isBalanceLoading =
    baseToken.symbol === 'AUDIO'
      ? isNullOrUndefined(accountBalance)
      : tokenBalanceStatus === Status.LOADING

  // Get balance in UI format
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

  return (
    <SwapTab
      inputToken={baseToken}
      outputToken={quoteToken}
      balance={{
        get: getBalance,
        loading: isBalanceLoading,
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
      onInputTokenChange={onInputTokenChange}
      onOutputTokenChange={onOutputTokenChange}
    />
  )
}
