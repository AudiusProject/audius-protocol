/**
 * Combined hook for managing token balance and exchange rate data
 * Consolidates data fetching and provides clean interface to consumers
 */

import { useMemo } from 'react'

import { useTokenBalance, useTokenExchangeRate } from '~/api'

import type { TokenInfo, TokenDataHookResult } from '../types/swap.types'
import {
  deriveDisplayExchangeRate,
  getSafeAmountForExchangeRate
} from '../utils/tokenCalculations'

export type UseTokenDataProps = {
  inputToken: TokenInfo
  outputToken: TokenInfo
  inputAmount: number
}

/**
 * Hook that consolidates token balance and exchange rate fetching
 * Provides a clean interface with loading states and error handling
 */
export const useTokenData = ({
  inputToken,
  outputToken,
  inputAmount
}: UseTokenDataProps): TokenDataHookResult => {
  // Get token balance
  const { data: balanceData, isPending: isBalanceLoading } = useTokenBalance({
    mint: inputToken.address,
    includeExternalWallets: false
  })

  // Get token price for calculations (currently unused but may be needed for future features)
  // const { data: tokenPriceData } = useArtistCoin({ mint: inputToken.address })

  // Calculate safe amount for exchange rate API
  const safeExchangeRateAmount = useMemo(() => {
    return getSafeAmountForExchangeRate(inputAmount)
  }, [inputAmount])

  // Get exchange rate data
  const {
    data: exchangeRateData,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError,
    refetch: refetchExchangeRate
  } = useTokenExchangeRate({
    inputMint: inputToken.address,
    outputMint: outputToken.address,
    inputDecimals: inputToken.decimals,
    outputDecimals: outputToken.decimals,
    inputAmount: safeExchangeRateAmount > 0 ? safeExchangeRateAmount : 1
  })

  // Process balance data
  const balance = useMemo(() => {
    return Number(balanceData?.balance ?? 0)
  }, [balanceData?.balance])

  const formattedBalance = useMemo(() => {
    if (!balanceData?.balance) return '0'
    return balanceData.balance.toString()
  }, [balanceData?.balance])

  // Process exchange rate data
  const exchangeRate = useMemo(() => {
    return exchangeRateData?.rate ?? null
  }, [exchangeRateData?.rate])

  const displayExchangeRate = useMemo(() => {
    return deriveDisplayExchangeRate(exchangeRateData || null)
  }, [exchangeRateData])

  return {
    // Balance data
    balance,
    formattedBalance,

    // Exchange rate data
    exchangeRate,
    displayExchangeRate,

    // Loading states
    isBalanceLoading,
    isExchangeRateLoading,

    // Error states
    balanceError: null, // Simplified for now
    exchangeRateError,

    // Refetch functions
    refetchBalance: () => {}, // Simplified for now
    refetchExchangeRate
  }
}
