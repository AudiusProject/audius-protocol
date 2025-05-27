import { useMemo } from 'react'

import { useAudioBalance } from '@audius/common/api'
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
      tooltipPlacement='right'
    />
  )
}
