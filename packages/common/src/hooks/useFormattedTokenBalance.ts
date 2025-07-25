import { useMemo } from 'react'

import { FixedDecimal } from '@audius/fixed-decimal'

import { useTokenBalance, useTokenPrice } from '../api'
import { Status } from '../models/Status'
import { getTokenDecimalPlaces, isNullOrUndefined } from '../utils'

type UseFormattedTokenBalanceReturn = {
  tokenBalance: FixedDecimal | null
  tokenBalanceFormatted: string | null
  isTokenBalanceLoading: boolean
  tokenPrice: string | null
  tokenDollarValue: string
  isTokenPriceLoading: boolean
}

/**
 * Hook to get formatted balance and price information for any supported mint
 * @param mint - The mint symbol to get balance and price for
 * @param locale - Locale for number formatting (defaults to 'en-US')
 * @returns Object with formatted balance, price, and loading states
 */
export const useFormattedTokenBalance = (
  mint: string,
  locale: string = 'en-US'
): UseFormattedTokenBalanceReturn => {
  const { data: tokenBalance, status: balanceStatus } = useTokenBalance({
    mint
  })
  const isTokenBalanceLoading = balanceStatus === Status.LOADING
  const { data: tokenPriceData, isPending: isTokenPriceLoading } =
    useTokenPrice(mint)

  const balance = tokenBalance?.balance

  const tokenPrice = tokenPriceData?.price || null
  const hasFetchedTokenBalance = !isNullOrUndefined(balance)

  // Format mint balance with dynamic decimal places
  const tokenBalanceFormatted = useMemo(() => {
    if (!hasFetchedTokenBalance || !balance) return null

    // Convert FixedDecimal to number for formatting
    const balanceNumber = Number(balance.toString())
    const decimalPlaces = getTokenDecimalPlaces(balanceNumber)

    // Cap maximumFractionDigits to not exceed the token's native decimal precision
    // FixedDecimal can't format with more decimals than it was constructed with
    const maxFractionDigits = Math.min(decimalPlaces, tokenBalance?.decimals)

    return balance.toLocaleString(locale, {
      maximumFractionDigits: maxFractionDigits,
      roundingMode: 'trunc'
    })
  }, [balance, hasFetchedTokenBalance, locale, tokenBalance?.decimals])

  // Calculate dollar value of user's mint balance
  const tokenDollarValue = useMemo(() => {
    if (!tokenPrice || !balance) return '$0.00'

    const priceNumber = Number(new FixedDecimal(tokenPrice).toString())
    const balanceValue = Number(balance.toString())
    const totalValue = priceNumber * balanceValue

    return `$${totalValue.toFixed(2)}`
  }, [balance, tokenPrice])

  return {
    tokenBalance: balance ?? null,
    tokenBalanceFormatted,
    isTokenBalanceLoading,
    tokenPrice,
    tokenDollarValue,
    isTokenPriceLoading
  }
}
