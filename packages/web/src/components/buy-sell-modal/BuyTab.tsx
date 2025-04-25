import { useMemo } from 'react'

import { useUSDCBalance } from '@audius/common/src/api/tan-query/useUSDCBalance'
import { Status } from '@audius/common/src/models/Status'

import { SwapTab } from './SwapTab'
import { TokenPair } from './types'

type BuyTabProps = {
  tokenPair: TokenPair
  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
  }) => void
}

export const BuyTab = ({ tokenPair, onTransactionDataChange }: BuyTabProps) => {
  // Extract the tokens from the pair
  const { baseToken, quoteToken } = tokenPair
  // Fetch real USDC balance
  const { status: balanceStatus, data: usdcBalance } = useUSDCBalance({
    isPolling: false
  })

  // Get USDC balance in UI format
  const getUsdcBalance = useMemo(() => {
    return () => {
      if (balanceStatus === Status.SUCCESS && usdcBalance) {
        return parseFloat(usdcBalance.toString()) / 10 ** quoteToken.decimals
      }
      return undefined
    }
  }, [balanceStatus, usdcBalance, quoteToken.decimals])

  return (
    <SwapTab
      inputToken={quoteToken}
      outputToken={baseToken}
      balance={{
        get: getUsdcBalance,
        loading: balanceStatus === Status.LOADING,
        formatError: () => 'Insufficient balance'
      }}
      onTransactionDataChange={onTransactionDataChange}
    />
  )
}
