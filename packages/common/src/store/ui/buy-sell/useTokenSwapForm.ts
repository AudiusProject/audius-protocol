import { useCallback, useEffect, useMemo, useRef } from 'react'

import { FixedDecimal } from '@audius/fixed-decimal'
import { useFormik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useArtistCoin } from '~/api'

import { useSwapCalculations } from './hooks/useSwapCalculations'
import { useSwapValidation } from './hooks/useSwapValidation'
import { useTokenData } from './hooks/useTokenData'
import { createSwapFormSchema, type SwapFormValues } from './swapFormSchema'
import type { TokenInfo } from './types/swap.types'
import { parseNumericAmount } from './utils/tokenCalculations'
import { resolveTokenLimits } from './utils/tokenLimits'

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
   * Minimum amount allowed for input (optional - will be calculated from USD limits if not provided)
   */
  min?: number
  /**
   * Maximum amount allowed for input (optional - will be calculated from USD limits if not provided)
   */
  max?: number
  /**
   * Callback for when transaction data changes
   */
  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
    error: string | null
    isInsufficientBalance: boolean
    exchangeRate?: number | null
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
  min: providedMin,
  max: providedMax,
  onTransactionDataChange,
  initialInputValue = '',
  onInputValueChange
}: TokenSwapFormProps) => {
  // Get token price for USD-based limit calculations
  const { data: tokenPriceData } = useArtistCoin({ mint: inputToken.address })
  const tokenPrice = tokenPriceData?.price
    ? Number(
        new FixedDecimal(tokenPriceData.price, inputToken.decimals).toString()
      )
    : null

  // Calculate min/max based on USD limits and current price
  const calculatedLimits = useMemo(() => {
    return resolveTokenLimits({
      tokenPrice,
      isStablecoin: inputToken.isStablecoin || false,
      providedMin,
      providedMax
    })
  }, [providedMin, providedMax, tokenPrice, inputToken.isStablecoin])

  const { min, max } = calculatedLimits

  // Use new composed hooks
  const tokenData = useTokenData({
    inputToken,
    outputToken,
    inputAmount: parseNumericAmount(initialInputValue)
  })

  const swapCalculations = useSwapCalculations({
    exchangeRate: tokenData.exchangeRate,
    onInputValueChange,
    inputTokenAddress: inputToken.address,
    outputTokenAddress: outputToken.address,
    inputTokenDecimals: inputToken.decimals,
    outputTokenDecimals: outputToken.decimals
  })

  const swapValidation = useSwapValidation({
    inputAmount: swapCalculations.inputAmount,
    balance: tokenData.balance,
    limits: calculatedLimits,
    tokenSymbol: inputToken.symbol,
    tokenDecimals: inputToken.decimals,
    isBalanceLoading: tokenData.isBalanceLoading,
    isTouched: true // Simplified - in real implementation would track this properly
  })

  const availableBalance = tokenData.balance
  // Create validation schema
  const validationSchema = useMemo(() => {
    return toFormikValidationSchema(
      createSwapFormSchema(
        min,
        max,
        availableBalance,
        inputToken.symbol,
        inputToken.decimals
      )
    )
  }, [min, max, availableBalance, inputToken.symbol, inputToken.decimals])

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

  const { values, setFieldValue, setFieldTouched } = formik

  // Refs to track last synced values to avoid circular dependencies
  const lastSyncedInputRef = useRef<string>('')
  const lastSyncedOutputRef = useRef<string>('')

  // Update form value when initialInputValue changes (tab switch)
  useEffect(() => {
    if (initialInputValue !== lastSyncedInputRef.current) {
      setFieldValue('inputAmount', initialInputValue, false)
      lastSyncedInputRef.current = initialInputValue
    }
  }, [initialInputValue, setFieldValue])

  // Re-validate input when token or balance changes. Guard to avoid infinite loops.
  const lastValidationKeyRef = useRef<string | null>(null)
  // Only re-validate on actual token change to avoid recursive updates during balance polling
  const tokenValidationKey = `${inputToken.address}-${outputToken.address}`
  useEffect(() => {
    if (!values.inputAmount || values.inputAmount === '') return
    if (lastValidationKeyRef.current !== tokenValidationKey) {
      lastValidationKeyRef.current = tokenValidationKey
      setFieldTouched('inputAmount', true, true)
      // Explicitly validate to refresh errors for the new token
      formik.validateForm()
    }
  }, [tokenValidationKey, values.inputAmount, setFieldTouched, formik])

  // Extract values from composed hooks
  const numericInputAmount = swapCalculations.numericInputAmount
  const numericOutputAmount = swapCalculations.numericOutputAmount
  const currentExchangeRate = tokenData.exchangeRate
  const displayExchangeRate = tokenData.displayExchangeRate
  const isExchangeRateLoading = tokenData.isExchangeRateLoading
  const exchangeRateError = tokenData.exchangeRateError
  const isBalanceLoading = tokenData.isBalanceLoading

  // Sync Formik values with our calculation hook
  // Use refs to avoid circular dependencies while still syncing when needed
  useEffect(() => {
    if (swapCalculations.inputAmount !== lastSyncedInputRef.current) {
      setFieldValue('inputAmount', swapCalculations.inputAmount, false)
      lastSyncedInputRef.current = swapCalculations.inputAmount
    }
  }, [swapCalculations.inputAmount, setFieldValue])

  useEffect(() => {
    if (swapCalculations.outputAmount !== lastSyncedOutputRef.current) {
      setFieldValue('outputAmount', swapCalculations.outputAmount, false)
      lastSyncedOutputRef.current = swapCalculations.outputAmount
    }
  }, [swapCalculations.outputAmount, setFieldValue])

  // Use validation from our composed hook
  const error = swapValidation.error
  const isInsufficientBalance = swapValidation.isInsufficientBalance

  // Memoize the transaction data to prevent excessive callbacks
  const transactionData = useMemo(
    () => ({
      inputAmount: numericInputAmount,
      outputAmount: numericOutputAmount,
      isValid: swapValidation.isValid,
      error,
      isInsufficientBalance,
      exchangeRate: currentExchangeRate
    }),
    [
      numericInputAmount,
      numericOutputAmount,
      swapValidation.isValid,
      error,
      isInsufficientBalance,
      currentExchangeRate
    ]
  )

  useEffect(() => {
    onTransactionDataChange?.(transactionData)
  }, [transactionData, onTransactionDataChange])

  // Handle input changes through our calculation hook
  const handleInputAmountChange = useCallback(
    (value: string) => {
      swapCalculations.handleInputChange(value)
      setFieldTouched('inputAmount', true, false)
    },
    [swapCalculations, setFieldTouched]
  )

  // Handle output amount changes through our calculation hook
  const handleOutputAmountChange = useCallback(
    (value: string) => {
      swapCalculations.handleOutputChange(value)
    },
    [swapCalculations]
  )

  // Handle max button click
  const handleMaxClick = useCallback(() => {
    const balance = tokenData.balance
    if (balance !== undefined) {
      const finalAmount = Math.min(balance, max)
      const finalAmountString = finalAmount.toString()
      swapCalculations.handleInputChange(finalAmountString)
      setFieldTouched('inputAmount', true, false)
    }
  }, [tokenData.balance, max, swapCalculations, setFieldTouched])

  return {
    inputAmount: swapCalculations.inputAmount, // Raw string input for display
    numericInputAmount,
    outputAmount: swapCalculations.outputAmount,
    numericOutputAmount,
    error,
    exchangeRateError,
    isExchangeRateLoading,
    isBalanceLoading,
    availableBalance,
    currentExchangeRate,
    displayExchangeRate,
    handleInputAmountChange,
    handleOutputAmountChange,
    handleMaxClick,
    formik,
    inputToken,
    outputToken,
    calculatedLimits // Expose the calculated limits
  }
}
