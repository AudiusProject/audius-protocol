import { useCallback, useState } from 'react'

import type { TransactionData } from './types'

export const useBuySellTransactionData = () => {
  const [transactionData, setTransactionData] = useState<TransactionData>(null)
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true)

  const handleTransactionDataChange = useCallback(
    (data: NonNullable<TransactionData>) => {
      setTransactionData(data)
      // Check specifically for insufficient balance error, not just any invalid state.
      const isInsufficient = data.error?.toLowerCase().includes('insufficient')
      if (data.inputAmount > 0 && isInsufficient) {
        setHasSufficientBalance(false)
      } else {
        setHasSufficientBalance(true)
      }
    },
    []
  )

  const resetTransactionData = useCallback(() => {
    setTransactionData(null)
    setHasSufficientBalance(true)
  }, [])

  return {
    transactionData,
    hasSufficientBalance,
    handleTransactionDataChange,
    resetTransactionData
  }
}
