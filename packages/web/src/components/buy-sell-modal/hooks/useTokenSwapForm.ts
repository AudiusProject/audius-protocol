import { useCallback, useEffect, useMemo, useState } from 'react'

import { useTokenExchangeRate } from '@audius/common/src/api/tan-query/useTokenExchangeRate'
import { JupiterTokenSymbol } from '@audius/common/src/services/Jupiter'

import { TokenInfo } from '../types'

export type BalanceConfig = {
  get: () => number | undefined
  loading: boolean
  formatError: (amount: number) => string
}

export type TokenSwapFormProps = {
  /**
   * The token the user is paying with (input)
   */
  inputToken: TokenInfo
  /**
   * The token the user is receiving (output)
   */
  outputToken: TokenInfo
  /**
   * Minimum amount allowed for input (optional)
   */
  min?: number
  /**
   * Maximum amount allowed for input (optional)
   */
  max?: number
  /**
   * Configuration for handling the input token balance
   */
  balance: BalanceConfig
  /**
   * Callback for when transaction data changes
   */
  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
  }) => void
}

/**
 * A hook to manage the common functionality for token swaps
 */
export const useTokenSwapForm = ({
  inputToken,
  outputToken,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  balance,
  onTransactionDataChange
}: TokenSwapFormProps) => {
  // Get token symbols for the exchange rate API
  const inputTokenSymbol = inputToken.symbol as JupiterTokenSymbol
  const outputTokenSymbol = outputToken.symbol as JupiterTokenSymbol

  // Destructure the balance config for easier access
  const {
    get: getInputBalance,
    loading: isBalanceLoading,
    formatError: formatBalanceError
  } = balance
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
    return balance !== undefined ? balance : (inputToken.balance ?? 0)
  }, [getInputBalance, inputToken.balance])

  // Use Jupiter API to get real-time exchange rate
  const {
    data: exchangeRateData,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError
  } = useTokenExchangeRate({
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

    if (numericInputAmount < min) {
      setError(`Minimum amount is ${min} ${inputToken.symbol}`)
      return
    }

    if (numericInputAmount > max) {
      setError(`Maximum amount is ${max} ${inputToken.symbol}`)
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
    min,
    max,
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
      const finalAmount = Math.min(balance, max)
      setInputAmount(finalAmount.toString())
    }
  }, [getInputBalance, max])

  // Use the real exchange rate if available, otherwise null (no default fallback)
  const currentExchangeRate = exchangeRateData ? exchangeRateData.rate : null

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
    handleMaxClick,
    // Including these for the component that consumes this hook
    inputToken,
    outputToken
  }
}
