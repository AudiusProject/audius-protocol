import { useCallback, useMemo } from 'react'

import { FixedDecimal } from '@audius/fixed-decimal'

import { formatUSDCValue } from '~/api'
import { getTokenDecimalPlaces, getCurrencyDecimalPlaces } from '~/utils'

export type UseTokenAmountFormattingProps = {
  amount?: string | number
  availableBalance?: number | null
  exchangeRate?: number | null
  isStablecoin: boolean
  decimals?: number
  placeholder?: string
}

export const DEFAULT_TOKEN_AMOUNT_PLACEHOLDER = '0.00'

const defaultDecimalPlaces = 2

// Maximum safe amount for calculations to prevent overflow errors
const MAX_SAFE_AMOUNT = 1000000000000

/**
 * Returns a safe numeric value for calculations, capping extremely large numbers
 */
const getSafeNumericValue = (value: string | number): number => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numericValue)) return 0
  return Math.min(Math.abs(numericValue), MAX_SAFE_AMOUNT)
}

export const useTokenAmountFormatting = ({
  amount,
  availableBalance,
  isStablecoin,
  decimals,
  placeholder = DEFAULT_TOKEN_AMOUNT_PLACEHOLDER
}: UseTokenAmountFormattingProps) => {
  const getDisplayDecimalPlaces = useCallback(
    (currentExchangeRate: number | null | undefined) => {
      if (isStablecoin) return defaultDecimalPlaces
      if (currentExchangeRate != null) {
        return getCurrencyDecimalPlaces(currentExchangeRate)
      }
      return defaultDecimalPlaces
    },
    [isStablecoin]
  )

  const formattedAvailableBalance = useMemo(() => {
    if (availableBalance == null || isNaN(availableBalance)) return placeholder

    if (isStablecoin) {
      return formatUSDCValue(availableBalance)
    }

    const tokenAmount = new FixedDecimal(availableBalance, decimals)
    const displayDecimals = getTokenDecimalPlaces(availableBalance)

    return tokenAmount.toLocaleString('en-US', {
      maximumFractionDigits: displayDecimals
    })
  }, [availableBalance, placeholder, isStablecoin, decimals])

  const formattedAmount = useMemo(() => {
    if (!amount && amount !== 0) return placeholder

    // Use safe value for calculations while preserving original for display logic
    const safeNumericAmount = getSafeNumericValue(amount)
    if (safeNumericAmount === 0) return placeholder

    if (isStablecoin) {
      return formatUSDCValue(safeNumericAmount)
    }

    const tokenAmount = new FixedDecimal(safeNumericAmount, decimals)
    const displayDecimals = getTokenDecimalPlaces(safeNumericAmount)

    return tokenAmount.toLocaleString('en-US', {
      maximumFractionDigits: displayDecimals
    })
  }, [amount, placeholder, isStablecoin, decimals])

  return {
    formattedAvailableBalance,
    formattedAmount,
    getDisplayDecimalPlaces
  }
}
