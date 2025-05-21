import { useMemo } from 'react'

import { useTotalBalanceWithFallback } from '@audius/common/hooks'
import { TokenPair } from '@audius/common/store'
import { isNullOrUndefined } from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'

import { SwapTab } from './SwapTab'

type SellTabProps = {
  tokenPair: TokenPair
  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
  }) => void
  error?: boolean
  errorMessage?: string
}

export const SellTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage
}: SellTabProps) => {
  // Extract the tokens from the pair
  const { baseToken, quoteToken } = tokenPair
  // Fetch real AUDIO balance using Redux (more reliable than tan-query in this context)
  const totalBalance = useTotalBalanceWithFallback()
  const isBalanceLoading = isNullOrUndefined(totalBalance)

  // Get AUDIO balance in UI format
  const getAudioBalance = useMemo(() => {
    return () => {
      if (!isBalanceLoading && totalBalance) {
        return parseFloat(AUDIO(totalBalance).toString())
      }
      return undefined
    }
  }, [totalBalance, isBalanceLoading])

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
    />
  )
}
