import React, { useMemo } from 'react'

import { useAudioBalance } from '@audius/common/api'
import type { TokenPair } from '@audius/common/store'
import { isNullOrUndefined } from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'

import { SwapTab } from './SwapTab'

type SellScreenProps = {
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

export const SellScreen = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange
}: SellScreenProps) => {
  // Extract the tokens from the pair
  const { baseToken, quoteToken } = tokenPair
  const { accountBalance } = useAudioBalance({ includeConnectedWallets: false })
  const isBalanceLoading = isNullOrUndefined(accountBalance)

  // Get AUDIO balance in UI format
  const getAudioBalance = useMemo(() => {
    return () => {
      if (!isBalanceLoading && accountBalance) {
        return parseFloat(AUDIO(accountBalance).toString())
      }
      return undefined
    }
  }, [accountBalance, isBalanceLoading])

  return (
    <SwapTab
      inputToken={baseToken}
      outputToken={quoteToken}
      balance={{
        get: getAudioBalance,
        loading: isBalanceLoading,
        formatError: () => 'Insufficient balance'
      }}
      onTransactionDataChange={onTransactionDataChange}
      isDefault={false}
      error={error}
      errorMessage={errorMessage}
      initialInputValue={initialInputValue}
      onInputValueChange={onInputValueChange}
    />
  )
}
