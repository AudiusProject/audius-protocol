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

  // Dynamically fetch balance for the currently selected input token
  const { accountBalance } = useAudioBalance({ includeConnectedWallets: false })
  const { data: tokenBalanceData, status: tokenBalanceStatus } =
    useTokenBalance({
      token: baseToken.symbol as any // Cast to satisfy the MintName type
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
