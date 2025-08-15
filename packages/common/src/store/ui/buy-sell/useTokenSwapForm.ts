import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useFormik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useTokenBalance, useTokenExchangeRate, useTokenPrice } from '~/api'

import { MIN_SWAP_AMOUNT_USD, MAX_SWAP_AMOUNT_USD } from './constants'
import { createSwapFormSchema, type SwapFormValues } from './swapFormSchema'
import type { TokenInfo } from './types'

export type BalanceConfig = {
  get: () => number | undefined
  loading: boolean
  formatError: (amount: number) => string
}

// Maximum safe amount for API calls to prevent errors
const MAX_SAFE_EXCHANGE_RATE_AMOUNT = 1000000000000

/**
 * Returns a safe numeric value for exchange rate API calls
 */
const getSafeAmountForExchangeRate = (amount: number): number => {
  return Math.min(amount, MAX_SAFE_EXCHANGE_RATE_AMOUNT)
}

/**
 * Calculates min/max token amounts based on USD limits and current token price
 */
const calculateTokenLimits = (
  tokenPrice: number | null,
  isStablecoin: boolean
): { min: number; max: number } => {
  if (isStablecoin) {
    // For stablecoins like USDC, 1 token ≈ $1 USD
    return {
      min: MIN_SWAP_AMOUNT_USD,
      max: MAX_SWAP_AMOUNT_USD
    }
  }

  if (!tokenPrice || tokenPrice <= 0) {
    // Fallback to reasonable defaults if price is unavailable
    return {
      min: 1,
      max: 1000000
    }
  }

  return {
    min: MIN_SWAP_AMOUNT_USD / tokenPrice,
    max: MAX_SWAP_AMOUNT_USD / tokenPrice
  }
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
  // Get token mint addresses for the exchange rate API
  const inputMint = inputToken.address
  const outputMint = outputToken.address

  const { data: inputTokenBalanceData, isPending: isBalanceLoading } =
    useTokenBalance({
      mint: inputToken.address,
      includeExternalWallets: false
    })

  // Get token price for USD-based limit calculations
  const { data: tokenPriceData } = useTokenPrice(inputToken.address)
  const tokenPrice = tokenPriceData?.price
    ? parseFloat(tokenPriceData.price)
    : null

  // Calculate min/max based on USD limits and current price
  const { min, max } = useMemo(() => {
    if (providedMin !== undefined && providedMax !== undefined) {
      return { min: providedMin, max: providedMax }
    }
    return calculateTokenLimits(tokenPrice, inputToken.isStablecoin || false)
  }, [providedMin, providedMax, tokenPrice, inputToken.isStablecoin])

  const availableBalance = Number(inputTokenBalanceData?.balance ?? 0)
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

  const { values, errors, touched, setFieldValue, setFieldTouched } = formik

  // Update form value when initialInputValue changes (tab switch)
  useEffect(() => {
    if (initialInputValue !== values.inputAmount) {
      setFieldValue('inputAmount', initialInputValue, false)
    }
  }, [initialInputValue, values.inputAmount, setFieldValue])

  // Re-validate input when token or balance changes. Guard to avoid infinite loops.
  const lastValidationKeyRef = useRef<string | null>(null)
  // Only re-validate on actual token change to avoid recursive updates during balance polling
  const tokenValidationKey = inputToken.address
  useEffect(() => {
    if (!values.inputAmount || values.inputAmount === '') return
    if (lastValidationKeyRef.current !== tokenValidationKey) {
      lastValidationKeyRef.current = tokenValidationKey
      setFieldTouched('inputAmount', true, true)
      // Explicitly validate to refresh errors for the new token
      formik.validateForm()
    }
  }, [tokenValidationKey, values.inputAmount, setFieldTouched, formik])

  // Calculate the numeric value of the input amount
  const numericInputAmount = useMemo(() => {
    if (!values.inputAmount) return 0
    const parsed = parseFloat(values.inputAmount)
    return isNaN(parsed) ? 0 : parsed
  }, [values.inputAmount])

  // Use safe amount for exchange rate API calls
  const safeExchangeRateAmount = useMemo(() => {
    return getSafeAmountForExchangeRate(numericInputAmount)
  }, [numericInputAmount])

  const {
    data: exchangeRateData,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError
  } = useTokenExchangeRate({
    inputMint,
    outputMint,
    inputAmount: safeExchangeRateAmount > 0 ? safeExchangeRateAmount : 1
  })

  // Get a static display rate using base amount of 1 for consistent display
  const { data: displayExchangeRateData } = useTokenExchangeRate({
    inputMint,
    outputMint,
    inputAmount: 1
  })

  // Update output amount when exchange rate or input amount changes
  useEffect(() => {
    if (numericInputAmount <= 0) {
      setFieldValue('outputAmount', '0', false)
      return
    }

    if (!isExchangeRateLoading && exchangeRateData) {
      // Use the actual input amount for output calculation, not the safe amount
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

  const currentExchangeRate = exchangeRateData ? exchangeRateData.rate : null
  const displayExchangeRate = displayExchangeRateData
    ? displayExchangeRateData.rate
    : null

  // Only show error if field has been touched, has a value, and has an error
  // This prevents showing "Required" error when field is empty during typing
  const error = useMemo(() => {
    if (!touched.inputAmount || !errors.inputAmount) return null
    if (values.inputAmount === '') return null // Don't show error for empty field
    return errors.inputAmount
  }, [touched.inputAmount, errors.inputAmount, values.inputAmount])

  // Derive insufficient balance directly from numeric values to avoid schema or message coupling
  const isInsufficientBalance = useMemo(() => {
    if (isBalanceLoading) return false
    if (values.inputAmount === '') return false
    return numericInputAmount > availableBalance
  }, [
    isBalanceLoading,
    values.inputAmount,
    numericInputAmount,
    availableBalance
  ])

  useEffect(() => {
    if (onTransactionDataChange) {
      const isValid =
        numericInputAmount > 0 && !errors.inputAmount && !isBalanceLoading

      onTransactionDataChange({
        inputAmount: numericInputAmount,
        outputAmount: numericOutputAmount,
        isValid,
        error,
        isInsufficientBalance,
        exchangeRate: currentExchangeRate
      })
    }
  }, [
    numericInputAmount,
    numericOutputAmount,
    errors.inputAmount,
    error, // Use the filtered error
    isExchangeRateLoading,
    onTransactionDataChange,
    isInsufficientBalance,
    currentExchangeRate,
    isBalanceLoading
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
    const balance = Number(inputTokenBalanceData?.balance ?? 0)
    if (balance !== undefined) {
      const finalAmount = Math.min(balance, max)
      const finalAmountString = finalAmount.toString()
      setFieldValue('inputAmount', finalAmountString, true)
      setFieldTouched('inputAmount', true, false)
      // Call the persistence callback
      onInputValueChange?.(finalAmountString)
    }
  }, [
    inputTokenBalanceData?.balance,
    max,
    setFieldValue,
    setFieldTouched,
    onInputValueChange
  ])

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
    displayExchangeRate,
    handleInputAmountChange,
    handleMaxClick,
    formik,
    inputToken,
    outputToken,
    calculatedLimits: { min, max } // Expose the calculated limits
  }
}
