import { useCallback, useEffect, useMemo } from 'react'

import { useTokenExchangeRate } from '@audius/common/src/api'
import { JupiterTokenSymbol } from '@audius/common/src/services/Jupiter'
import { TokenInfo } from '@audius/common/store'
import { useFormik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { createSwapFormSchema, SwapFormValues } from '../schemas/swapFormSchema'

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

  const { get: getInputBalance, loading: isBalanceLoading } = balance

  const availableBalance = useMemo(() => {
    const balance = getInputBalance()
    return balance !== undefined ? balance : (inputToken.balance ?? 0)
  }, [getInputBalance, inputToken.balance])

  // Create validation schema
  const validationSchema = useMemo(() => {
    return toFormikValidationSchema(
      createSwapFormSchema(min, max, availableBalance, inputToken.symbol)
    )
  }, [min, max, availableBalance, inputToken.symbol])

  // Initialize form with Formik
  const formik = useFormik<SwapFormValues>({
    initialValues: {
      inputAmount: ''
    },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: () => {
      // The form is never actually submitted - we just use Formik for validation
      // and state management
    }
  })

  const { values, errors, touched, setFieldValue, setFieldTouched } = formik

  // Calculate the numeric value of the input amount
  const numericInputAmount = useMemo(() => {
    if (!values.inputAmount) return 0
    const parsed = parseFloat(values.inputAmount)
    return isNaN(parsed) ? 0 : parsed
  }, [values.inputAmount])

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

  useEffect(() => {
    if (onTransactionDataChange) {
      const isValid =
        numericInputAmount > 0 && !errors.inputAmount && !isExchangeRateLoading

      onTransactionDataChange({
        inputAmount: numericInputAmount,
        outputAmount,
        isValid
      })
    }
  }, [
    numericInputAmount,
    outputAmount,
    errors.inputAmount,
    isExchangeRateLoading,
    onTransactionDataChange
  ])

  // Handle input changes
  const handleInputAmountChange = useCallback(
    (value: string) => {
      // Allow only valid number input with better decimal handling
      if (value === '' || /^(\d*\.?\d*|\d+\.)$/.test(value)) {
        setFieldValue('inputAmount', value, true)
        setFieldTouched('inputAmount', true, false)
      }
    },
    [setFieldValue, setFieldTouched]
  )

  // Handle max button click
  const handleMaxClick = useCallback(() => {
    const balance = getInputBalance()
    if (balance !== undefined) {
      const finalAmount = Math.min(balance, max)
      setFieldValue('inputAmount', finalAmount.toString(), true)
      setFieldTouched('inputAmount', true, false)
    }
  }, [getInputBalance, max, setFieldValue, setFieldTouched])

  const currentExchangeRate = exchangeRateData ? exchangeRateData.rate : null

  const error =
    touched.inputAmount && errors.inputAmount ? errors.inputAmount : null

  return {
    inputAmount: values.inputAmount, // Raw string input for display
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
    formik,
    inputToken,
    outputToken
  }
}
