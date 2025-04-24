import { useCallback, useEffect, useMemo, useState } from 'react'

import { TokenExchangeRateParams } from '@audius/common/src/api/tan-query/useTokenExchangeRate'
import { JupiterTokenSymbol } from '@audius/common/src/services/JupiterTokenExchange'

import { TokenInfo } from '../types'

export type TokenSwapDirection = 'buy' | 'sell'

export type TokenSwapFormProps = {
  inputToken: TokenInfo
  outputToken: TokenInfo
  inputTokenSymbol: JupiterTokenSymbol
  outputTokenSymbol: JupiterTokenSymbol
  minAmount: number
  maxAmount: number
  getInputBalance: () => number | undefined
  isBalanceLoading: boolean
  formatBalanceError: (amount: number) => string
  getExchangeRate: (params: TokenExchangeRateParams) => {
    data: { rate: number } | undefined
    isLoading: boolean
    error: Error | null
  }
  defaultExchangeRate: number
  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
  }) => void
}

/**
 * A hook to manage the common functionality for both Buy and Sell tabs
 */
export const useTokenSwapForm = ({
  inputToken,
  outputToken,
  inputTokenSymbol,
  outputTokenSymbol,
  minAmount,
  maxAmount,
  getInputBalance,
  isBalanceLoading,
  formatBalanceError,
  getExchangeRate,
  defaultExchangeRate,
  onTransactionDataChange
}: TokenSwapFormProps) => {
  const [inputAmount, setInputAmount] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Calculate the numeric value of the input amount
  const numericInputAmount = useMemo(() => {
    const parsed = parseFloat(inputAmount || '0')
    return isNaN(parsed) ? 0 : parsed
  }, [inputAmount])

  // Get the available balance
  const availableBalance = useMemo(() => {
    const balance = getInputBalance()
    return balance !== undefined ? balance : inputToken.balance
  }, [getInputBalance, inputToken.balance])

  // Use Jupiter API to get real-time exchange rate
  const {
    data: exchangeRateData,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError
  } = getExchangeRate({
    inputTokenSymbol,
    outputTokenSymbol,
    inputAmount: numericInputAmount > 0 ? numericInputAmount : 1
  })

  // Calculate the output amount based on the exchange rate
  const outputAmount = useMemo(() => {
    if (numericInputAmount <= 0) return 0
    if (isExchangeRateLoading || !exchangeRateData) return 0

    return exchangeRateData.rate * numericInputAmount
  }, [numericInputAmount, exchangeRateData, isExchangeRateLoading])

  // Validate the input amount
  useEffect(() => {
    if (numericInputAmount === 0) {
      setError(null)
      return
    }

    if (numericInputAmount < minAmount) {
      setError(`Minimum amount is ${minAmount} ${inputToken.symbol}`)
      return
    }

    if (numericInputAmount > maxAmount) {
      setError(`Maximum amount is ${maxAmount} ${inputToken.symbol}`)
      return
    }

    // Check if user has enough balance
    const balance = getInputBalance()
    if (balance !== undefined && numericInputAmount > balance) {
      setError(formatBalanceError(numericInputAmount))
      return
    }

    setError(null)
  }, [
    numericInputAmount,
    minAmount,
    maxAmount,
    getInputBalance,
    formatBalanceError,
    inputToken.symbol
  ])

  // Update the parent component with transaction data
  useEffect(() => {
    if (onTransactionDataChange) {
      onTransactionDataChange({
        inputAmount: numericInputAmount,
        outputAmount,
        isValid: numericInputAmount > 0 && !error && !isExchangeRateLoading
      })
    }
  }, [
    numericInputAmount,
    outputAmount,
    error,
    isExchangeRateLoading,
    onTransactionDataChange
  ])

  // Handle input changes
  const handleInputAmountChange = useCallback((value: string) => {
    // Allow only valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputAmount(value)
    }
  }, [])

  // Handle max button click
  const handleMaxClick = useCallback(() => {
    const balance = getInputBalance()
    if (balance !== undefined) {
      // Limit to MAX_AMOUNT
      const finalAmount = Math.min(balance, maxAmount)
      setInputAmount(finalAmount.toString())
    }
  }, [getInputBalance, maxAmount])

  // Use the real exchange rate if available, otherwise use the default
  const currentExchangeRate = exchangeRateData
    ? exchangeRateData.rate
    : defaultExchangeRate

  return {
    inputAmount,
    numericInputAmount,
    outputAmount,
    error,
    exchangeRateError,
    isExchangeRateLoading,
    isBalanceLoading,
    availableBalance,
    currentExchangeRate,
    handleInputAmountChange,
    handleMaxClick
  }
}
