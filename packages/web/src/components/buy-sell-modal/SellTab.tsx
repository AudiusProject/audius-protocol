import { useMemo } from 'react'

import { useAudioBalance, useTokenBalance } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { MintName } from '@audius/common/services'
import { TokenPair, TokenInfo } from '@audius/common/store'
import { isNullOrUndefined } from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'

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

  // Determine which balance hook to use based on input token
  const mintName = useMemo(() => {
    switch (baseToken.symbol) {
      case 'USDC':
        return 'USDC' as MintName
      case 'AUDIO':
        return 'wAUDIO' as MintName
      case 'BONK':
        return 'BONK' as MintName
      default:
        return 'wAUDIO' as MintName
    }
  }, [baseToken.symbol])

  // For AUDIO, use the specialized hook for compatibility
  const { accountBalance } = useAudioBalance({ includeConnectedWallets: false })
  const { data: tokenBalanceData, status: tokenBalanceStatus } =
    useTokenBalance({
      token: mintName
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
          return parseFloat(AUDIO(accountBalance).toString())
        }
      } else {
        if (tokenBalanceStatus === Status.SUCCESS && tokenBalanceData) {
          return parseFloat(tokenBalanceData.toString())
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
