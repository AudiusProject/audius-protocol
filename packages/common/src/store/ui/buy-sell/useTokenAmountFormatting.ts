import { useCallback, useMemo } from 'react'

import { getCurrencyDecimalPlaces } from '../../../utils'

export type UseTokenAmountFormattingProps = {
  amount?: string | number
  availableBalance: number
  exchangeRate?: number | null
  isStablecoin: boolean
  placeholder?: string
}

const defaultDecimalPlaces = 2

export const useTokenAmountFormatting = ({
  amount,
  availableBalance,
  exchangeRate,
  isStablecoin,
  placeholder = '0.00'
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
    if (isNaN(availableBalance)) return placeholder

    const decimals = getDisplayDecimalPlaces(exchangeRate)

    return availableBalance.toLocaleString('en-US', {
      minimumFractionDigits: defaultDecimalPlaces,
      maximumFractionDigits: decimals
    })
  }, [availableBalance, exchangeRate, getDisplayDecimalPlaces, placeholder])

  const formattedAmount = useMemo(() => {
    if (!amount && amount !== 0) return placeholder
    const numericAmount =
      typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numericAmount)) return placeholder

    const decimals = getDisplayDecimalPlaces(exchangeRate)

    return numericAmount.toLocaleString('en-US', {
      minimumFractionDigits: defaultDecimalPlaces,
      maximumFractionDigits: decimals
    })
  }, [amount, exchangeRate, getDisplayDecimalPlaces, placeholder])

  return {
    formattedAvailableBalance,
    formattedAmount,
    getDisplayDecimalPlaces
  }
}
