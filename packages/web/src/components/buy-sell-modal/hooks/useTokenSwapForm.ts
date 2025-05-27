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
  /**
   * Initial value for the input field
   */
  initialInputValue?: string
  /**
   * Callback for when input value changes (for persistence)
   */
  onInputValueChange?: (value: string) => void
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
  onTransactionDataChange,
  initialInputValue = '',
  onInputValueChange
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
      inputAmount: initialInputValue,
      outputAmount: '0'
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

  // Update form value when initialInputValue changes (tab switch)
  useEffect(() => {
    if (initialInputValue !== values.inputAmount) {
      setFieldValue('inputAmount', initialInputValue, false)
    }
  }, [initialInputValue, values.inputAmount, setFieldValue])

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

  // Update output amount when exchange rate or input amount changes
  useEffect(() => {
    if (numericInputAmount <= 0) {
      setFieldValue('outputAmount', '0', false)
      return
    }

    if (!isExchangeRateLoading && exchangeRateData) {
      const newAmount = exchangeRateData.rate * numericInputAmount
      setFieldValue('outputAmount', newAmount.toString(), false)
    }
  }, [
    numericInputAmount,
    exchangeRateData,
    isExchangeRateLoading,
    setFieldValue
  ])

  const numericOutputAmount = useMemo(() => {
    if (!values.outputAmount) return 0
    const parsed = parseFloat(values.outputAmount)
    return isNaN(parsed) ? 0 : parsed
  }, [values.outputAmount])

  useEffect(() => {
    if (onTransactionDataChange) {
      const isValid = numericInputAmount > 0 && !errors.inputAmount

      onTransactionDataChange({
        inputAmount: numericInputAmount,
        outputAmount: numericOutputAmount,
        isValid
      })
    }
  }, [
    numericInputAmount,
    numericOutputAmount,
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
        // Call the persistence callback
        onInputValueChange?.(value)
      }
    },
    [setFieldValue, setFieldTouched, onInputValueChange]
  )

  // Handle max button click
  const handleMaxClick = useCallback(() => {
    const balance = getInputBalance()
    if (balance !== undefined) {
      const finalAmount = Math.min(balance, max)
      const finalAmountString = finalAmount.toString()
      setFieldValue('inputAmount', finalAmountString, true)
      setFieldTouched('inputAmount', true, false)
      // Call the persistence callback
      onInputValueChange?.(finalAmountString)
    }
  }, [getInputBalance, max, setFieldValue, setFieldTouched, onInputValueChange])

  const currentExchangeRate = exchangeRateData ? exchangeRateData.rate : null

  const error =
    touched.inputAmount && errors.inputAmount ? errors.inputAmount : null

  return {
    inputAmount: values.inputAmount, // Raw string input for display
    numericInputAmount,
    outputAmount: values.outputAmount,
    numericOutputAmount,
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
