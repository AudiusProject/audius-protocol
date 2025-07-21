import { useMemo } from 'react'

import { FixedDecimal } from '@audius/fixed-decimal'

import { useTokenBalance, useTokenPrice } from '../api'
import { useQueryContext } from '../api/tan-query/utils'
import { Status } from '../models/Status'
import { MintName } from '../services/audius-backend/solana'
import { getTokenBySymbol } from '../services/tokens'
import { isNullOrUndefined, getTokenDecimalPlaces } from '../utils'

type UseFormattedTokenBalanceReturn = {
  tokenBalance: FixedDecimal | null
  tokenBalanceFormatted: string | null
  isTokenBalanceLoading: boolean
  tokenPrice: string | null
  tokenDollarValue: string
  isTokenPriceLoading: boolean
}

/**
 * Hook to get formatted balance and price information for any supported token
 * @param token - The token symbol to get balance and price for
 * @param locale - Locale for number formatting (defaults to 'en-US')
 * @returns Object with formatted balance, price, and loading states
 */
export const useFormattedTokenBalance = (
  token: MintName,
  locale: string = 'en-US'
): UseFormattedTokenBalanceReturn => {
  const { env } = useQueryContext()
  const { data: tokenBalance, status: balanceStatus } = useTokenBalance({
    token
  })
  const isTokenBalanceLoading = balanceStatus === Status.LOADING

  // Get token configuration for price lookup
  const tokenConfig = getTokenBySymbol(env, token)
  const tokenMintAddress = tokenConfig?.address || null

  const { data: tokenPriceData, isPending: isTokenPriceLoading } =
    useTokenPrice(tokenMintAddress)
  const tokenPrice = tokenPriceData?.price || null
  const hasFetchedTokenBalance = !isNullOrUndefined(tokenBalance)

  // Format token balance with dynamic decimal places
  const tokenBalanceFormatted = useMemo(() => {
    if (!hasFetchedTokenBalance || !tokenBalance) return null

    // Convert FixedDecimal to number for formatting
    const balanceNumber = Number(tokenBalance.toString())
    const decimalPlaces = getTokenDecimalPlaces(balanceNumber)

    return tokenBalance.toLocaleString(locale, {
      maximumFractionDigits: decimalPlaces,
      roundingMode: 'trunc'
    })
  }, [tokenBalance, hasFetchedTokenBalance, locale])

  // Calculate dollar value of user's token balance
  const tokenDollarValue = useMemo(() => {
    if (!tokenPrice || !tokenBalance) return '$0.00'

    const priceNumber = Number(new FixedDecimal(tokenPrice).toString())
    const balanceValue = Number(tokenBalance.toString())
    const totalValue = priceNumber * balanceValue

    return `$${totalValue.toFixed(2)} ($${priceNumber.toFixed(4)})`
  }, [tokenBalance, tokenPrice])

  return {
    tokenBalance,
    tokenBalanceFormatted,
    isTokenBalanceLoading,
    tokenPrice,
    tokenDollarValue,
    isTokenPriceLoading
  }
}
