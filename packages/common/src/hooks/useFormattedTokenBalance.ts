import { useMemo } from 'react'

import { FixedDecimal } from '@audius/fixed-decimal'

import { useTokenBalance, useArtistCoins } from '../api'
import {
  getTokenDecimalPlaces,
  formatCurrencyWithSubscript,
  isNullOrUndefined
} from '../utils'

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
  const { data: tokenBalance, isPending: isTokenBalanceLoading } =
    useTokenBalance({
      mint
    })

  const { data: tokenPriceData, isPending: isTokenPriceLoading } =
    useArtistCoins({ mint: [mint] })

  const balance = tokenBalance?.balance

  const tokenPrice = tokenPriceData?.[0]?.price || null
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
    if (!tokenPrice) return '$0.00'

    const priceNumber = Number(new FixedDecimal(tokenPrice).toString())
    return formatCurrencyWithSubscript(priceNumber)
  }, [tokenPrice])

  return {
    tokenBalance: balance ?? null,
    tokenBalanceFormatted,
    isTokenBalanceLoading,
    tokenPrice: tokenPrice?.toString() ?? null,
    tokenDollarValue,
    isTokenPriceLoading
  }
}
