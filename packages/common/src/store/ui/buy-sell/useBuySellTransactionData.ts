import { useCallback, useState } from 'react'

import type { TransactionData } from './types'

export const useBuySellTransactionData = () => {
  const [transactionData, setTransactionData] = useState<TransactionData>(null)
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true)

  const handleTransactionDataChange = useCallback(
    (data: NonNullable<TransactionData>) => {
      setTransactionData(data)
      // Inferring insufficient balance if amount > 0 and not valid
      setHasSufficientBalance(!(data.inputAmount > 0 && !data.isValid))
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
